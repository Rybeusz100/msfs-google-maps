use actix_cors::Cors;
use actix_web::{web, App, HttpServer};
use airports::Airports;
use log::error;
use services::*;
use sim_connection::Message;
use stop_handle::StopHandle;

mod airports;
mod hello;
mod models;
mod services;
mod sim_connection;
mod stop_handle;
mod utils;

#[actix_web::main]
async fn main() {
    #[cfg(debug_assertions)]
    std::env::set_var("RUST_LOG", "debug");
    #[cfg(not(debug_assertions))]
    std::env::set_var("RUST_LOG", "warn");

    #[cfg(debug_assertions)]
    const FILES_DIR: &str = "../front/dist/";
    #[cfg(not(debug_assertions))]
    const FILES_DIR: &str = "./front/";

    pretty_env_logger::init();

    hello::hello_message();

    let (handle, worker_conn) = sim_connection::start();
    let tx = worker_conn.tx.lock().unwrap().clone();

    let airports = match Airports::from_file("./assets/airports.json") {
        Ok(v) => v,
        Err(why) => {
            error!("Reading airports.json failed: {}", why);
            Airports::new()
        }
    };

    let stop_handle = web::Data::new(StopHandle::default());
    let worker_conn = web::Data::new(worker_conn);
    let airports = web::Data::new(airports);

    let server = HttpServer::new({
        let stop_handle = stop_handle.clone();
        move || {
            App::new()
                .wrap(Cors::permissive())
                .app_data(stop_handle.clone())
                .app_data(worker_conn.clone())
                .app_data(airports.clone())
                .service(position)
                .service(position_known)
                .service(api_key)
                .service(get_airports)
                .service(management)
                .service(status)
                .service(actix_files::Files::new("/", FILES_DIR).index_file("index.html"))
        }
    })
    .bind(("0.0.0.0", 8054))
    .unwrap()
    .run();

    stop_handle.register(server.handle());
    server.await.unwrap();

    tx.send(Message::Stop).unwrap();
    handle.join().unwrap();
}
