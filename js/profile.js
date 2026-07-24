/*=====================================================
                PROFILE.JS
                LifeVerse Profile System
=====================================================*/


document.addEventListener("DOMContentLoaded",()=>{


    console.log("👤 Profile System Loaded");


    loadProfile();


    setupProfileImage();


    setupProfileButtons();


});






/*=====================================================
                LOAD PROFILE DATA
=====================================================*/


function loadProfile(){


    const user =
    JSON.parse(
        localStorage.getItem("user")
    );



    if(!user) return;



    const username =
    document.querySelectorAll(
        ".profile-name"
    );



    username.forEach(element=>{


        element.textContent =
        user.username;


    });





    const email =
    document.querySelectorAll(
        ".profile-email"
    );



    email.forEach(element=>{


        element.textContent =
        user.email;


    });





    const level =
    document.querySelectorAll(
        ".profile-level"
    );



    level.forEach(element=>{


        element.textContent =
        "Level " + user.level;


    });



}







/*=====================================================
                PROFILE IMAGE UPLOAD
=====================================================*/


function setupProfileImage(){


    const imageInput =
    document.querySelector(
        "#profileImageInput"
    );



    const imagePreview =
    document.querySelector(
        "#profileImage"
    );



    if(!imageInput || !imagePreview)
        return;




    imageInput.addEventListener(
        "change",
        function(){



            const file =
            this.files[0];



            if(!file)
                return;




            const reader =
            new FileReader();



            reader.onload=function(e){



                imagePreview.src =
                e.target.result;



                localStorage.setItem(
                    "profileImage",
                    e.target.result
                );



                showNotification(
                    "📸 Profile picture updated!"
                );


            };



            reader.readAsDataURL(file);



        }
    );


}






/*=====================================================
                LOAD SAVED IMAGE
=====================================================*/


function loadProfileImage(){


    const savedImage =
    localStorage.getItem(
        "profileImage"
    );



    const image =
    document.querySelector(
        "#profileImage"
    );



    if(
        savedImage
        &&
        image
    ){


        image.src =
        savedImage;


    }


}






/*=====================================================
                PROFILE SETTINGS
=====================================================*/


function setupProfileButtons(){


    const saveButton =
    document.querySelector(
        "#saveProfile"
    );



    if(saveButton){


        saveButton.addEventListener(
            "click",
            saveProfile
        );


    }



}







function saveProfile(){


    const user =
    JSON.parse(
        localStorage.getItem("user")
    );



    if(!user)
        return;




    const newName =
    document.querySelector(
        "#editUsername"
    )?.value;



    if(newName){


        user.username =
        newName;



        localStorage.setItem(
            "username",
            newName
        );


    }





    localStorage.setItem(
        "user",
        JSON.stringify(user)
    );



    showNotification(
        "✅ Profile saved!"
    );



    loadProfile();


}






/*=====================================================
                PROFILE RESET
=====================================================*/


function resetProfile(){


    localStorage.removeItem(
        "profileImage"
    );


    const image =
    document.querySelector(
        "#profileImage"
    );



    if(image){


        image.src =
        "assets/default-profile.png";


    }



    showNotification(
        "🗑️ Profile picture removed"
    );


}






// Load saved image when ready

loadProfileImage();