use crate::{
    airports::Airports,
    models::{ManagementCommand, ManagementRequest},
    sim_connection::SimWorkerConn,
    stop_handle::StopHandle,
};
use actix_web::{get, post, web, HttpResponse, Responder};
use serde_json::json;
use std::fs;

#[post("/management")]
async fn management(
    stop_handle: web::Data<StopHandle>,
    conn: web::Data<SimWorkerConn>,
    input: web::Json<ManagementRequest>,
) -> impl Responder {
    match input.command {
        ManagementCommand::Shutdown => {
            stop_handle.stop(false);
            HttpResponse::Ok().finish()
        }
        ManagementCommand::ResetRoute => {
            let mut route = conn.route.lock().unwrap();
            route.reset();
            HttpResponse::Ok().body(json!({"id": route.id()}).to_string())
        }
    }
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

#[get("/api_key")]
async fn api_key() -> impl Responder {
    match fs::read_to_string("./api_key.txt") {
        Ok(contents) => HttpResponse::Ok().body(contents.trim().to_owned()),
        Err(_) => HttpResponse::NotFound().finish(),
    }
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
