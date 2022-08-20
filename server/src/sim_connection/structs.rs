use serde::Serialize;
use std::sync::{mpsc, Arc, Mutex};
use uuid::Uuid;

use super::enums::*;

#[allow(dead_code)]
#[derive(Debug, Serialize, Clone)]
pub struct Position {
    pub lat: f64,
    pub lon: f64,
    pub alt: f64,
    pub hdg: f64,
}

pub struct Route {
    id: String,
    points: Vec<Position>,
}

pub struct SimWorkerConn {
    pub tx: Mutex<mpsc::Sender<Message>>,
    pub route: Arc<Mutex<Route>>,
}

impl Route {
    pub fn new() -> Route {
        Route {
            id: Uuid::new_v4().to_string(),
            points: Vec::<Position>::new(),
        }
    }

    pub fn reset(&mut self) {
        self.id = Uuid::new_v4().to_string();
        self.points = Vec::new();
    }

    pub fn add_point(&mut self, point: Position) {
        self.points.push(point);
    }

    pub fn get_last_points(&self, known_count: usize) -> Option<&[Position]> {
        if self.points.len() <= known_count {
            return None;
        }
        Some(&self.points[known_count..])
    }

    pub fn id(&self) -> &str {
        self.id.as_str()
    }

    pub fn get_position(&self) -> Option<&Position> {
        self.points.last()
    }
}

impl Default for Route {
    fn default() -> Self {
        Self::new()
    }
}

impl Position {
    pub fn is_ok(&self) -> bool {
        if self.lat < 1f64 && self.lon < 1f64 && self.alt < 10f64 {
            return false;
        }
        true
    }
}
