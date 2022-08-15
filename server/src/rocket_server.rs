use crate::sim_connection::{Message, SimWorkerConn};
use rocket::fs::NamedFile;
use rocket::{Shutdown, State};
use serde_json::json;
use std::path::{Path, PathBuf};

mod airports;
mod utils;

use airports::*;

#[get("/")]
async fn index() -> Option<NamedFile> {
    NamedFile::open(Path::new("../front/index.html")).await.ok()
}

#[get("/<file..>")]
async fn file(file: PathBuf) -> Option<NamedFile> {
    NamedFile::open(Path::new("../front/").join(file))
        .await
        .ok()
}

#[get("/shutdown")]
fn shutdown(shutdown: Shutdown) -> &'static str {
    shutdown.notify();
    "Shutting down..."
}

#[get("/position")]
fn position(conn: &State<SimWorkerConn>) -> String {
    let route = conn.route.lock().unwrap();

    if let Some(position) = route.get_position() {
        serde_json::to_string(position).unwrap()
    } else {
        String::from("{}")
    }
}

#[get("/position/<known_count>")]
fn position_known(known_count: usize, conn: &State<SimWorkerConn>) -> String {
    let route = conn.route.lock().unwrap();

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
fn reset_route(conn: &State<SimWorkerConn>) -> String {
    let mut route = conn.route.lock().unwrap();
    route.reset();
    json!({"id": route.id()}).to_string()
}

#[get("/api_key")]
async fn api_key() -> Option<NamedFile> {
    NamedFile::open(Path::new("../api_key")).await.ok()
}

#[get("/airports/<latitude>/<longitude>/<radius_km>")]
fn get_airports(
    latitude: f64,
    longitude: f64,
    radius_km: f64,
    airports: &State<Airports>,
) -> String {
    let found = airports.find_closest(latitude, longitude, radius_km);
    serde_json::to_string(&found).unwrap()
}

pub async fn start(conn: SimWorkerConn) {
    let tx = conn.tx.lock().unwrap().clone();
    let airports = match Airports::from_file("../airports.json") {
        Ok(v) => v,
        Err(why) => {
            error!("Reading airports.json failed: {}", why);
            Airports::new()
        }
    };

    let _rocket = rocket::build()
        .mount(
            "/",
            routes![
                index,
                file,
                shutdown,
                position,
                api_key,
                position_known,
                reset_route,
                get_airports
            ],
        )
        .manage(conn)
        .manage(airports)
        .ignite()
        .await
        .unwrap()
        .launch()
        .await
        .unwrap();

    tx.send(Message::Stop).unwrap();
}
