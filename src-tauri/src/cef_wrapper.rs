use std::ffi::CString;
use std::os::raw::{c_char, c_int};
use std::sync::{Arc, Mutex};
use std::collections::HashMap;
use serde::{Serialize, Deserialize};

// Внешние CEF функции (наша обертка)
extern "C" {
    fn cef_wrapper_initialize(resources_path: *const c_char, locales_path: *const c_char, locale: *const c_char) -> c_int;
    fn cef_wrapper_shutdown();
    fn cef_wrapper_do_message_loop_work();
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CefBrowserInfo {
    pub id: String,
    pub url: String,
    pub title: String,
    pub is_loading: bool,
    pub can_go_back: bool,
    pub can_go_forward: bool,
}

pub struct CefManager {
    browsers: Arc<Mutex<HashMap<String, CefBrowserInfo>>>,
    initialized: Arc<Mutex<bool>>,
}

impl CefManager {
    pub fn new() -> Self {
        Self {
            browsers: Arc::new(Mutex::new(HashMap::new())),
            initialized: Arc::new(Mutex::new(false)),
        }
    }

    pub fn initialize(&self) -> Result<(), String> {
        let mut initialized = self.initialized.lock().map_err(|e| e.to_string())?;
        if *initialized {
            return Ok(());
        }

        // Путь к ресурсам CEF
        let cef_path = std::env::current_exe()
            .map_err(|e| format!("Failed to get current exe: {}", e))?
            .parent()
            .ok_or("Failed to get parent dir")?
            .join("cef");
        
        // Проверяем существование CEF директории
        if !cef_path.exists() {
            return Err(format!("CEF directory not found at: {}", cef_path.display()));
        }
        
        let resources_path = cef_path.join("Resources");
        let locales_path = resources_path.join("locales");
        
        // Проверяем существование ресурсов
        if !resources_path.exists() {
            return Err(format!("CEF Resources directory not found at: {}", resources_path.display()));
        }
        
        if !locales_path.exists() {
            return Err(format!("CEF locales directory not found at: {}", locales_path.display()));
        }
        
        // Проверяем libcef.so
        let libcef_path = cef_path.join("libcef.so");
        if !libcef_path.exists() {
            return Err(format!("libcef.so not found at: {}", libcef_path.display()));
        }

        eprintln!("CEF initialization:");
        eprintln!("  CEF path: {}", cef_path.display());
        eprintln!("  Resources: {}", resources_path.display());
        eprintln!("  Locales: {}", locales_path.display());

        // Конвертируем пути в C-строки
        let resources_cstr = CString::new(resources_path.to_string_lossy().as_ref())
            .map_err(|e| format!("Failed to convert resources path: {}", e))?;
        let locales_cstr = CString::new(locales_path.to_string_lossy().as_ref())
            .map_err(|e| format!("Failed to convert locales path: {}", e))?;
        let locale_cstr = CString::new("ru-RU")
            .map_err(|e| format!("Failed to convert locale: {}", e))?;

        eprintln!("Calling cef_wrapper_initialize...");
        let result = unsafe {
            cef_wrapper_initialize(
                resources_cstr.as_ptr(),
                locales_cstr.as_ptr(),
                locale_cstr.as_ptr()
            )
        };

        eprintln!("cef_wrapper_initialize returned: {}", result);

        if result == 0 {
            return Err(format!("Failed to initialize CEF (returned 0). Check that:\n\
                1. All CEF libraries are present in {}\n\
                2. LD_LIBRARY_PATH includes the CEF directory\n\
                3. All dependencies are installed (run: ldd {})",
                cef_path.display(),
                libcef_path.display()
            ));
        }

        *initialized = true;
        eprintln!("CEF initialized successfully!");
        Ok(())
    }

    pub fn create_browser(&self, id: String, url: String, _parent_window: *const std::ffi::c_void) -> Result<(), String> {
        // TODO: Реализовать создание браузера через CEF API
        // Пока просто добавляем в список
        let mut browsers = self.browsers.lock().map_err(|e| e.to_string())?;
        browsers.insert(id.clone(), CefBrowserInfo {
            id,
            url,
            title: String::new(),
            is_loading: true,
            can_go_back: false,
            can_go_forward: false,
        });

        Ok(())
    }

    pub fn get_browser(&self, id: &str) -> Result<Option<CefBrowserInfo>, String> {
        let browsers = self.browsers.lock().map_err(|e| e.to_string())?;
        Ok(browsers.get(id).cloned())
    }

    pub fn get_all_browsers(&self) -> Result<Vec<CefBrowserInfo>, String> {
        let browsers = self.browsers.lock().map_err(|e| e.to_string())?;
        Ok(browsers.values().cloned().collect())
    }

    pub fn remove_browser(&self, id: &str) -> Result<(), String> {
        let mut browsers = self.browsers.lock().map_err(|e| e.to_string())?;
        browsers.remove(id);
        Ok(())
    }

    pub fn do_message_loop_work(&self) {
        unsafe {
            cef_wrapper_do_message_loop_work();
        }
    }

    pub fn shutdown(&self) -> Result<(), String> {
        let mut initialized = self.initialized.lock().map_err(|e| e.to_string())?;
        if !*initialized {
            return Ok(());
        }

        unsafe {
            cef_wrapper_shutdown();
        }

        *initialized = false;
        Ok(())
    }


}

impl Drop for CefManager {
    fn drop(&mut self) {
        let _ = self.shutdown();
    }
}
