use crate::{airports::Airports, sim_connection::SimWorkerConn, stop_handle::StopHandle};
use actix_web::{get, web, Responder};
use serde_json::json;
use std::fs;

#[get("/shutdown")]
async fn shutdown(stop_handle: web::Data<StopHandle>) -> impl Responder {
    stop_handle.stop(false);
    "Shutting down..."
}

#[get("/position")]
async fn position(conn: web::Data<SimWorkerConn>) -> impl Responder {
    let route = conn.route.lock().unwrap();

    if let Some(position) = route.get_position() {
        serde_json::to_string(position).unwrap()
    } else {
        "{}".to_owned()
    }
}

#[get("/position/{known_count}")]
async fn position_known(path: web::Path<usize>, conn: web::Data<SimWorkerConn>) -> impl Responder {
    let route = conn.route.lock().unwrap();
    let known_count = path.into_inner();

    if let Some(points) = route.get_last_points(known_count) {
        json!({
            "id": route.id(),
            "points": points
        })
        .to_string()
    } else {
        json!({
            "id": route.id(),
            "points": []
        })
        .to_string()
    }
}

#[get("/reset")]
async fn reset_route(conn: web::Data<SimWorkerConn>) -> impl Responder {
    let mut route = conn.route.lock().unwrap();
    route.reset();
    json!({"id": route.id()}).to_string()
}

#[get("/api_key")]
async fn api_key() -> impl Responder {
    let key = match fs::read_to_string("./api_key.txt") {
        Ok(contents) => contents.trim().to_owned(),
        Err(_) => "".to_owned(),
    };

    key
}

#[get("/airports/{latitude}/{longitude}/{radius_km}")]
async fn get_airports(
    path: web::Path<(f64, f64, f64)>,
    airports: web::Data<Airports>,
) -> impl Responder {
    let (latitude, longitude, radius_km) = path.into_inner();
    let found = airports.find_closest(latitude, longitude, radius_km);
    serde_json::to_string(&found).unwrap()
}
