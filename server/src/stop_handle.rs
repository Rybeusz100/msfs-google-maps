// https://github.com/actix/examples/blob/master/shutdown-server
use actix_web::dev::ServerHandle;
use parking_lot::Mutex;

#[derive(Default)]
pub struct StopHandle {
    inner: Mutex<Option<ServerHandle>>,
}

impl StopHandle {
    pub(crate) fn register(&self, handle: ServerHandle) {
        *self.inner.lock() = Some(handle);
    }

    pub(crate) fn stop(&self, graceful: bool) {
        #[allow(clippy::let_underscore_future)]
        let _ = self.inner.lock().as_ref().unwrap().stop(graceful);
    }
}
