use super::Position;

const RADIUS: f64 = 6371f64;

#[allow(dead_code)]
pub struct FakeRoute {
    start_pos: Position,
    end_pos: Position,
    current_pos: Position,
    max_alt: f64,
    asc: f64,
}

#[allow(dead_code)]
impl FakeRoute {
    pub fn new(start_pos: Position, end_pos: Position) -> FakeRoute {
        let current_pos = Position {
            lat: start_pos.lat,
            lon: start_pos.lon,
            alt: start_pos.alt,
            hdg: bearing(&start_pos, &end_pos),
        };
        FakeRoute {
            start_pos,
            end_pos,
            current_pos,
            max_alt: 55000f64,
            asc: 1f64,
        }
    }

    pub fn get_position(&mut self) -> Position {
        self.current_pos = pos_from_dir(&self.current_pos, self.current_pos.hdg, 0.3);
        self.current_pos.alt += 50f64 * self.asc;
        if self.current_pos.alt < 10f64 {
            self.asc = 1f64;
        }
        else if self.current_pos.alt > self.max_alt {
            self.asc = -1f64;
        }
        self.current_pos.clone()
    }
}

fn bearing(start_pos: &Position, end_pos: &Position) -> f64 {
    let delta_lon = end_pos.lon - start_pos.lon;
    let x = end_pos.lat.cos() * delta_lon.sin();
    let y = start_pos.lat.cos() * end_pos.lat.sin()
        - start_pos.lat.sin() * end_pos.lat.cos() * delta_lon.cos();

    x.atan2(y).to_degrees()
}

fn pos_from_dir(start_pos: &Position, bearing: f64, distance: f64) -> Position {
    let ratio = distance / RADIUS;
    let lat1 = start_pos.lat.to_radians();
    let lon1 = start_pos.lon.to_radians();
    let bearing = bearing.to_radians();

    let lat2 = (lat1.sin() * ratio.cos() + lat1.cos() * ratio.sin() * bearing.cos()).asin();
    let lon2 = lon1
        + (bearing.sin() * ratio.sin() * lat1.cos()).atan2(ratio.cos() - lat1.sin() * lat2.sin());

    Position {
        lat: lat2.to_degrees(),
        lon: lon2.to_degrees(),
        alt: start_pos.alt,
        hdg: start_pos.hdg,
    }
}
