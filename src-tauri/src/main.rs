// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod oauth;
mod storage;
mod downloads;
mod cef_wrapper;
mod cef_commands;

use tauri::Manager;
use std::sync::{Mutex, Arc};
use cef_wrapper::CefManager;

struct AppState {
    frozen_tabs: Mutex<std::collections::HashSet<String>>,
    downloads: Mutex<std::collections::HashMap<String, downloads::Download>>,
}

fn main() {
    // Инициализация CEF менеджера
    let cef_manager = Arc::new(CefManager::new());
    
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .manage(AppState {
            frozen_tabs: Mutex::new(std::collections::HashSet::new()),
            downloads: Mutex::new(std::collections::HashMap::new()),
        })
        .manage(cef_manager.clone())
        .invoke_handler(tauri::generate_handler![
            commands::window_minimize,
            commands::window_maximize,
            commands::window_close,
            commands::window_fullscreen,
            commands::is_fullscreen,
            commands::get_settings,
            commands::set_settings,
            commands::get_bookmarks,
            commands::set_bookmarks,
            commands::get_history,
            commands::add_history,
            commands::clear_history,
            commands::open_external,
            commands::show_save_dialog,
            commands::show_error,
            commands::export_bookmarks,
            commands::import_bookmarks,
            commands::freeze_tab,
            commands::unfreeze_tab,
            commands::is_tab_frozen,
            commands::get_downloads,
            commands::cancel_download,
            commands::open_download,
            commands::show_download_in_folder,
            commands::clear_completed_downloads,
            commands::import_from_browser,
            commands::save_session,
            commands::restore_session,
            commands::clear_session,
            commands::google_oauth_login,
            commands::google_oauth_refresh,
            commands::google_oauth_logout,
            commands::google_oauth_get_user,
            cef_commands::cef_initialize,
            cef_commands::cef_create_browser,
            cef_commands::cef_get_browser,
            cef_commands::cef_get_all_browsers,
            cef_commands::cef_close_browser,
            cef_commands::cef_navigate,
            cef_commands::cef_go_back,
            cef_commands::cef_go_forward,
            cef_commands::cef_reload,
            cef_commands::cef_stop,
            cef_commands::cef_execute_javascript,
            cef_commands::cef_set_zoom_level,
            cef_commands::cef_get_zoom_level,
        ])
        .setup(|app| {
            #[cfg(desktop)]
            {
                let window = app.get_webview_window("main").unwrap();
                
                // Регистрируем глобальные горячие клавиши
                setup_shortcuts(&window);
            }
            
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

fn setup_shortcuts(_window: &tauri::WebviewWindow) {
    // Note: Global shortcuts in Tauri v2 require the global-shortcut plugin
    // For now, we'll skip this functionality until the plugin is added
    // TODO: Add tauri-plugin-global-shortcut to Cargo.toml
    return;
    
    /*
    use tauri::GlobalShortcutManager;
    
    let mut shortcuts = window.app_handle().global_shortcut_manager();
    let w = window.clone();
    
    // Ctrl+T - новая вкладка
    let _ = shortcuts.register("CmdOrCtrl+T", move || {
        let _ = w.emit("shortcut", "new-tab");
    });
    
    let w = window.clone();
    // Ctrl+W - закрыть вкладку
    let _ = shortcuts.register("CmdOrCtrl+W", move || {
        let _ = w.emit("shortcut", "close-tab");
    });
    
    let w = window.clone();
    // Ctrl+L - фокус на адресной строке
    let _ = shortcuts.register("CmdOrCtrl+L", move || {
        let _ = w.emit("shortcut", "focus-url");
    });
    
    let w = window.clone();
    // Ctrl+R / F5 - перезагрузка
    let _ = shortcuts.register("CmdOrCtrl+R", move || {
        let _ = w.emit("shortcut", "reload");
    });
    
    let w = window.clone();
    let _ = shortcuts.register("F5", move || {
        let _ = w.emit("shortcut", "reload");
    });
    
    let w = window.clone();
    // Alt+Home - домой
    let _ = shortcuts.register("Alt+Home", move || {
        let _ = w.emit("shortcut", "home");
    });
    
    let w = window.clone();
    // Ctrl+F - поиск
    let _ = shortcuts.register("CmdOrCtrl+F", move || {
        let _ = w.emit("shortcut", "find");
    });
    
    let w = window.clone();
    // Ctrl++ - увеличить масштаб
    let _ = shortcuts.register("CmdOrCtrl+Plus", move || {
        let _ = w.emit("shortcut", "zoom-in");
    });
    
    let w = window.clone();
    // Ctrl+- - уменьшить масштаб
    let _ = shortcuts.register("CmdOrCtrl+-", move || {
        let _ = w.emit("shortcut", "zoom-out");
    });
    
    let w = window.clone();
    // Ctrl+0 - сбросить масштаб
    let _ = shortcuts.register("CmdOrCtrl+0", move || {
        let _ = w.emit("shortcut", "zoom-reset");
    });
    
    let w = window.clone();
    // F11 - полноэкранный режим
    let _ = shortcuts.register("F11", move || {
        let _ = w.emit("shortcut", "fullscreen");
    });
    
    let w = window.clone();
    // Ctrl+Shift+I / F12 - DevTools
    let _ = shortcuts.register("CmdOrCtrl+Shift+I", move || {
        let _ = w.emit("shortcut", "devtools");
    });
    
    let w = window.clone();
    let _ = shortcuts.register("F12", move || {
        let _ = w.emit("shortcut", "devtools");
    });
    
    let w = window.clone();
    // Ctrl+P - печать
    let _ = shortcuts.register("CmdOrCtrl+P", move || {
        let _ = w.emit("shortcut", "print");
    });
    
    let w = window.clone();
    // Esc - escape
    let _ = shortcuts.register("Escape", move || {
        let _ = w.emit("shortcut", "escape");
    });
    
    let w = window.clone();
    // Ctrl+Shift+T - восстановить вкладку
    let _ = shortcuts.register("CmdOrCtrl+Shift+T", move || {
        let _ = w.emit("shortcut", "restore-tab");
    });
    
    let w = window.clone();
    // Ctrl+D - закладки
    let _ = shortcuts.register("CmdOrCtrl+D", move || {
        let _ = w.emit("shortcut", "bookmarks");
    });
    
    let w = window.clone();
    // Ctrl+H - история
    let _ = shortcuts.register("CmdOrCtrl+H", move || {
        let _ = w.emit("shortcut", "history");
    });
    
    let w = window.clone();
    // Ctrl+J - загрузки
    let _ = shortcuts.register("CmdOrCtrl+J", move || {
        let _ = w.emit("shortcut", "downloads");
    });
    
    let w = window.clone();
    // Ctrl+Shift+A - поиск по вкладкам
    let _ = shortcuts.register("CmdOrCtrl+Shift+A", move || {
        let _ = w.emit("shortcut", "search-tabs");
    });
    */
}
