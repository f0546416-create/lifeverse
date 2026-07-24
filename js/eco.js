/*=====================================================
                ECO.JS
                LifeVerse Eco Challenge System
=====================================================*/


document.addEventListener("DOMContentLoaded",()=>{


    console.log("🌱 Eco System Loaded");


    loadEcoChallenges();


});







/*=====================================================
                ECO CHALLENGES
=====================================================*/


let ecoChallenges = JSON.parse(
    localStorage.getItem("ecoChallenges")
) || [


    {
        id:1,
        title:"Recycle Plastic",
        description:"Recycle 5 plastic items today",
        progress:0,
        goal:5,
        reward:50,
        completed:false
    },


    {
        id:2,
        title:"Save Electricity",
        description:"Turn off unused devices",
        progress:0,
        goal:3,
        reward:40,
        completed:false
    },


    {
        id:3,
        title:"Plant Something Green",
        description:"Add a plant to your environment",
        progress:0,
        goal:1,
        reward:100,
        completed:false
    }


];








/*=====================================================
                DISPLAY CHALLENGES
=====================================================*/


function loadEcoChallenges(){


    const container =
    document.querySelector(
        ".eco-container"
    );



    if(!container)
        return;



    container.innerHTML="";



    ecoChallenges.forEach(challenge=>{


        container.innerHTML += `


        <div class="eco-card">


            <h3>
            🌱 ${challenge.title}
            </h3>


            <p>
            ${challenge.description}
            </p>



            <div class="progress-bar">

                <div 
                class="progress-fill"
                style="
                width:${getProgress(challenge)}%
                ">
                </div>

            </div>



            <p>
            ${challenge.progress}/${challenge.goal}
            </p>



            ${
                challenge.completed

                ?

                `
                <button disabled>
                ✅ Completed
                </button>
                `

                :

                `
                <button onclick="completeEco(${challenge.id})">
                Complete
                </button>
                `

            }



        </div>


        `;


    });


}








/*=====================================================
                PROGRESS %
=====================================================*/


function getProgress(challenge){


    return (
        challenge.progress /
        challenge.goal
    ) * 100;


}








/*=====================================================
                COMPLETE CHALLENGE
=====================================================*/


function completeEco(id){


    const challenge =
    ecoChallenges.find(
        item=>item.id===id
    );



    if(!challenge)
        return;




    if(
        challenge.progress <
        challenge.goal
    ){


        challenge.progress++;


    }



    if(
        challenge.progress >=
        challenge.goal
    ){


        challenge.completed=true;



        giveEcoReward(
            challenge.reward
        );



        showNotification(
            "🌍 Eco challenge completed!"
        );


    }



    saveEco();



    loadEcoChallenges();


}







/*=====================================================
                GIVE REWARD
=====================================================*/


function giveEcoReward(amount){


    const user =
    JSON.parse(
        localStorage.getItem("user")
    );



    if(!user)
        return;



    user.coins =
    (user.coins || 0)
    +
    amount;



    user.xp =
    (user.xp || 0)
    +
    amount;



    localStorage.setItem(
        "user",
        JSON.stringify(user)
    );


}







/*=====================================================
                SAVE ECO DATA
=====================================================*/


function saveEco(){


    localStorage.setItem(
        "ecoChallenges",
        JSON.stringify(
            ecoChallenges
        )
    );


}