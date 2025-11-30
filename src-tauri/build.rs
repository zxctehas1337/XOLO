fn main() {
    tauri_build::build();
    
    // Линковка CEF библиотек
    let cef_path = std::path::PathBuf::from("cef");
    
    #[cfg(target_os = "linux")]
    {
        let cef_release = format!("{}/Release", cef_path.display());
        let cef_include = format!("{}", cef_path.display());
        
        // Компилируем C обертку
        cc::Build::new()
            .file("cef/cef_wrapper.c")
            .include(&cef_include)
            .warnings(false)
            .compile("cef_wrapper");
        
        println!("cargo:rustc-link-search=native={}", cef_release);
        println!("cargo:rustc-link-lib=dylib=cef");
        
        // Добавляем rpath для поиска библиотек CEF
        println!("cargo:rustc-link-arg=-Wl,-rpath,$ORIGIN/cef");
        println!("cargo:rustc-link-arg=-Wl,-rpath,$ORIGIN");
        
        // Проверяем наличие libcef.so
        let libcef_path = format!("{}/libcef.so", cef_release);
        if !std::path::Path::new(&libcef_path).exists() {
            eprintln!("WARNING: libcef.so not found at {}", libcef_path);
            eprintln!("Run setup-cef.sh to install CEF libraries");
        }
        
        println!("cargo:rerun-if-changed=cef/cef_wrapper.c");
        println!("cargo:rerun-if-changed=cef/cef_wrapper.h");
    }
    
    #[cfg(target_os = "windows")]
    {
        println!("cargo:rustc-link-search=native={}\\Release", cef_path.display());
        println!("cargo:rustc-link-lib=dylib=libcef");
    }
    
    #[cfg(target_os = "macos")]
    {
        println!("cargo:rustc-link-search=native={}/Release", cef_path.display());
        println!("cargo:rustc-link-lib=framework=Chromium Embedded Framework");
    }
}
