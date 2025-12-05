// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod storage;
mod downloads;
mod webview_manager;

use tauri::Manager;
use std::sync::Mutex;
use webview_manager::WebViewManager;

pub struct AppState {
    pub frozen_tabs: Mutex<std::collections::HashSet<String>>,
    pub downloads: Mutex<std::collections::HashMap<String, downloads::Download>>,
    pub webview_manager: Mutex<WebViewManager>,
    pub webview_bounds: Mutex<std::collections::HashMap<String, webview_manager::WebViewBounds>>,
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .manage(AppState {
            frozen_tabs: Mutex::new(std::collections::HashSet::new()),
            downloads: Mutex::new(std::collections::HashMap::new()),
            webview_manager: Mutex::new(WebViewManager::new()),
            webview_bounds: Mutex::new(std::collections::HashMap::new()),
        })
        .invoke_handler(tauri::generate_handler![
            // Window commands
            commands::window_minimize,
            commands::window_maximize,
            commands::window_close,
            commands::window_fullscreen,
            commands::is_fullscreen,
            // Settings
            commands::get_settings,
            commands::set_settings,
            // Bookmarks
            commands::get_bookmarks,
            commands::set_bookmarks,
            // History
            commands::get_history,
            commands::add_history,
            commands::clear_history,
            // External
            commands::open_external,
            commands::show_save_dialog,
            commands::show_error,
            commands::export_bookmarks,
            commands::import_bookmarks,
            // Tab management
            commands::freeze_tab,
            commands::unfreeze_tab,
            commands::is_tab_frozen,
            // Downloads
            commands::get_downloads,
            commands::cancel_download,
            commands::open_download,
            commands::show_download_in_folder,
            commands::clear_completed_downloads,
            // Import
            commands::import_from_browser,
            // Session
            commands::save_session,
            commands::restore_session,
            commands::clear_session,
            // WebView2 commands
            webview_manager::create_webview,
            webview_manager::close_webview,
            webview_manager::navigate_webview,
            webview_manager::go_back,
            webview_manager::go_forward,
            webview_manager::reload_webview,
            webview_manager::stop_webview,
            webview_manager::get_webview_info,
            webview_manager::execute_script,
            webview_manager::set_zoom,
            webview_manager::update_webview_bounds,
            webview_manager::set_webview_visible,
            webview_manager::get_webview_url,
            webview_manager::webview_exists,
            webview_manager::get_webview_title,
        ])
        .setup(|app| {
            let window = app.get_webview_window("main").unwrap();
            // Регистрируем горячие клавиши через JavaScript
            setup_keyboard_shortcuts(&window);
            
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

fn setup_keyboard_shortcuts(window: &tauri::WebviewWindow) {
    use tauri::Emitter;
    
    // Отправляем событие для инициализации клавиатурных сокращений на фронтенде
    let _ = window.emit("init-shortcuts", ());
}
