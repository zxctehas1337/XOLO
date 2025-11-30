use tauri::State;
use crate::cef_wrapper::{CefManager, CefBrowserInfo};
use std::sync::Arc;

#[tauri::command]
pub async fn cef_initialize(cef: State<'_, Arc<CefManager>>) -> Result<(), String> {
    cef.initialize()
}

#[tauri::command]
pub async fn cef_create_browser(
    cef: State<'_, Arc<CefManager>>,
    id: String,
    url: String,
) -> Result<(), String> {
    // В Tauri мы не можем напрямую получить нативный window handle
    // Поэтому создаем браузер без родительского окна (offscreen rendering)
    cef.create_browser(id, url, std::ptr::null_mut())
}

#[tauri::command]
pub async fn cef_get_browser(
    cef: State<'_, Arc<CefManager>>,
    id: String,
) -> Result<Option<CefBrowserInfo>, String> {
    cef.get_browser(&id)
}

#[tauri::command]
pub async fn cef_get_all_browsers(
    cef: State<'_, Arc<CefManager>>,
) -> Result<Vec<CefBrowserInfo>, String> {
    cef.get_all_browsers()
}

#[tauri::command]
pub async fn cef_close_browser(
    cef: State<'_, Arc<CefManager>>,
    id: String,
) -> Result<(), String> {
    cef.remove_browser(&id)
}

#[tauri::command]
pub async fn cef_navigate(
    _cef: State<'_, Arc<CefManager>>,
    _id: String,
    _url: String,
) -> Result<(), String> {
    // TODO: Реализовать навигацию через CEF API
    Ok(())
}

#[tauri::command]
pub async fn cef_go_back(
    _cef: State<'_, Arc<CefManager>>,
    _id: String,
) -> Result<(), String> {
    // TODO: Реализовать через CEF API
    Ok(())
}

#[tauri::command]
pub async fn cef_go_forward(
    _cef: State<'_, Arc<CefManager>>,
    _id: String,
) -> Result<(), String> {
    // TODO: Реализовать через CEF API
    Ok(())
}

#[tauri::command]
pub async fn cef_reload(
    _cef: State<'_, Arc<CefManager>>,
    _id: String,
) -> Result<(), String> {
    // TODO: Реализовать через CEF API
    Ok(())
}

#[tauri::command]
pub async fn cef_stop(
    _cef: State<'_, Arc<CefManager>>,
    _id: String,
) -> Result<(), String> {
    // TODO: Реализовать через CEF API
    Ok(())
}

#[tauri::command]
pub async fn cef_execute_javascript(
    _cef: State<'_, Arc<CefManager>>,
    _id: String,
    _code: String,
) -> Result<(), String> {
    // TODO: Реализовать через CEF API
    Ok(())
}

#[tauri::command]
pub async fn cef_set_zoom_level(
    _cef: State<'_, Arc<CefManager>>,
    _id: String,
    _level: f64,
) -> Result<(), String> {
    // TODO: Реализовать через CEF API
    Ok(())
}

#[tauri::command]
pub async fn cef_get_zoom_level(
    _cef: State<'_, Arc<CefManager>>,
    _id: String,
) -> Result<f64, String> {
    // TODO: Реализовать через CEF API
    Ok(1.0)
}
