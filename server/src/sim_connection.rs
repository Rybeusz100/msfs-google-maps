use log::{info, trace, warn};
use simconnect_sdk::{Notification, SimConnect};
use std::{
    sync::{mpsc, Arc, Mutex},
    thread::{self, JoinHandle},
    time::Duration,
};

mod enums;
#[cfg(feature = "fake_route")]
mod fake_route;
mod structs;

pub use enums::*;
#[cfg(feature = "fake_route")]
use fake_route::FakeRoute;
pub use structs::*;

pub fn start() -> (JoinHandle<()>, SimWorkerConn) {
    let (tx, rx) = mpsc::channel::<Message>();
    let route = Arc::new(Mutex::new(Route::new()));
    let connected = Arc::new(Mutex::new(false));

    let handle;
    {
        let route = route.clone();
        let connected = connected.clone();
        #[cfg(feature = "fake_route")]
        let mut fake_route = FakeRoute::new(Position {
            lat: 50.076707070424845,
            lon: 19.778160533188096,
            alt: 0f64,
            hdg: 0f64,
        });
        handle = thread::spawn(move || 'thread: loop {
            #[cfg(feature = "fake_route")]
            {
                if let Ok(Message::Stop) = rx.try_recv() {
                    info!("Message::Stop received, stopping simconnect");
                    break 'thread;
                }
                route.lock().unwrap().add_point(fake_route.get_position());
                thread::sleep(Duration::from_millis(500));
                continue 'thread;
            }

            let mut client;
            *connected.lock().unwrap() = false;
            loop {
                match SimConnect::new("msfs-google-maps") {
                    Ok(c) => {
                        info!("Successfully created a SimConnect SDK client");
                        client = c;
                        *connected.lock().unwrap() = true;
                        break;
                    }
                    Err(_) => {
                        trace!("Connection to the simulator failed, retrying");
                    }
                }
                if let Ok(Message::Stop) = rx.try_recv() {
                    info!("Message::Stop received, stopping simconnect");
                    break 'thread;
                }
                thread::sleep(Duration::from_secs(1));
            }

            '_main: loop {
                if let Ok(Message::Stop) = rx.try_recv() {
                    info!("Message::Stop received, stopping simconnect");
                    break 'thread;
                }

                match client.get_next_dispatch() {
                    Ok(notif) => match notif {
                        Some(Notification::Open) => {
                            info!("Connection to the simulator opened");
                            if client.register_object::<Position>().is_err() {
                                warn!("Error registering simconnect data, restarting simconnect");
                                continue 'thread;
                            } else {
                                info!("Successfully registered simconnect data");
                            }
                        }
                        Some(Notification::Object(data)) => {
                            if let Ok(mut position_data) = Position::try_from(&data) {
                                position_data.hdg = position_data.hdg.to_degrees();
                                if position_data.is_ok() {
                                    route.lock().unwrap().add_point(position_data);
                                }
                            }
                        }
                        Some(Notification::Quit) => {
                            info!("Connection ended by the simulator, restarting simconnect");
                            continue 'thread;
                        }
                        _ => {}
                    },
                    Err(_) => {
                        warn!("Error receiving data from the simulator, restarting simconnect");
                        continue 'thread;
                    }
                }
                thread::sleep(Duration::from_millis(100));
            }
        })
    }

    (
        handle,
        SimWorkerConn {
            tx: Mutex::new(tx),
            route,
            connected,
        },
    )
}
