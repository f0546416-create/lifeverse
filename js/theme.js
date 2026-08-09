/*=====================================================
                THEME.JS
                LifeVerse Theme System
=====================================================*/


document.addEventListener("DOMContentLoaded",()=>{


    console.log("🌙 Theme System Loaded");


    loadTheme();


    setupThemeButton();


});





/*=====================================================
                LOAD SAVED THEME
=====================================================*/


function loadTheme(){


    const savedTheme = localStorage.getItem("theme");


    if(savedTheme === "dark"){


        document.body.classList.add("dark-mode");


    }


}






/*=====================================================
                THEME BUTTON
=====================================================*/


function setupThemeButton(){


    const themeButtons = document.querySelectorAll(
        "#themeToggle, .theme-toggle, [data-theme]"
    );



    themeButtons.forEach(button=>{


        button.addEventListener("click",()=>{


            toggleTheme();


        });


    });


}






/*=====================================================
                SWITCH THEME
=====================================================*/


function toggleTheme(){


    document.body.classList.toggle("dark-mode");



    const isDark = document.body.classList.contains(
        "dark-mode"
    );



    if(isDark){


        localStorage.setItem(
            "theme",
            "dark"
        );


        showNotification(
            "🌙 Dark mode enabled"
        );


    }

    else{


        localStorage.setItem(
            "theme",
            "light"
        );


        showNotification(
            "☀️ Light mode enabled"
        );


    }


}






/*=====================================================
                AUTO UPDATE ICON
=====================================================*/


function updateThemeIcon(){


    const icons=document.querySelectorAll(
        ".theme-icon"
    );



    const dark =
    document.body.classList.contains(
        "dark-mode"
    );



    icons.forEach(icon=>{


        icon.textContent =
        dark ? "☀️" : "🌙";


    });


}





/*=====================================================
                SYSTEM THEME CHECK
=====================================================*/


if(window.matchMedia){


    const systemTheme =
    window.matchMedia(
        "(prefers-color-scheme: dark)"
    );



    if(
        !localStorage.getItem("theme")
        &&
        systemTheme.matches
    ){


        document.body.classList.add(
            "dark-mode"
        );


    }


}