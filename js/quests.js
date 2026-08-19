/*=====================================================
                QUESTS.JS
                LifeVerse Quest System
=====================================================*/


document.addEventListener("DOMContentLoaded",()=>{


    console.log("🎯 Quest System Loaded");


    loadQuests();


    setupQuestButtons();


});







/*=====================================================
                QUEST DATA
=====================================================*/


let quests = JSON.parse(
    localStorage.getItem("quests")
) || [


    {
        id:1,
        title:"Recycle 5 Plastic Bottles",
        description:"Recycle plastic items to help the planet",
        progress:0,
        goal:5,
        rewardXP:150,
        rewardCoins:50,
        completed:false,
        claimed:false
    },


    {
        id:2,
        title:"Save Water Today",
        description:"Reduce water usage while cleaning",
        progress:0,
        goal:1,
        rewardXP:100,
        rewardCoins:30,
        completed:false,
        claimed:false
    },


    {
        id:3,
        title:"Use Eco Transport",
        description:"Walk, cycle or use public transport",
        progress:0,
        goal:1,
        rewardXP:200,
        rewardCoins:75,
        completed:false,
        claimed:false
    }


];







/*=====================================================
                LOAD QUESTS
=====================================================*/


function loadQuests(){


    const containers =
    document.querySelectorAll(
        ".quest-container"
    );



    containers.forEach(container=>{


        container.innerHTML="";



        quests.forEach(quest=>{


            container.innerHTML += createQuestCard(
                quest
            );


        });



    });


}








/*=====================================================
                QUEST CARD
=====================================================*/


function createQuestCard(quest){


    let progress =
    (quest.progress / quest.goal) * 100;



    return `

    <div class="quest-card">


        <h3>${quest.title}</h3>


        <p>${quest.description}</p>



        <div class="progress-bar">


            <div 
            class="progress-fill"
            style="width:${progress}%">
            </div>


        </div>



        <p>
        ${quest.progress}/${quest.goal}
        Completed
        </p>



        <p>
        🎁 ${quest.rewardXP} XP 
        + 
        🪙 ${quest.rewardCoins} Coins
        </p>



        ${
            quest.completed

            ?

            quest.claimed

                ?

            `<button disabled>
            ✅ Claimed
            </button>`

                :

            `<button onclick="claimQuest(${quest.id})">
            Claim Reward
            </button>`


            :

            `<button onclick="increaseQuest(${quest.id})">
            Complete Step
            </button>`

        }



    </div>

    `;


}







/*=====================================================
                COMPLETE QUEST STEP
=====================================================*/


function increaseQuest(id){


    const quest =
    quests.find(
        q=>q.id===id
    );



    if(!quest)
        return;



    if(
        quest.progress < quest.goal
    ){


        quest.progress++;


    }



    if(
        quest.progress >= quest.goal
    ){


        quest.completed=true;


        showNotification(
            "🎉 Quest completed!"
        );


    }



    saveQuests();


    loadQuests();


}







/*=====================================================
                CLAIM REWARD
=====================================================*/


function claimQuest(id){


    const quest =
    quests.find(
        q=>q.id===id
    );



    if(
        !quest ||
        !quest.completed ||
        quest.claimed
    )
    return;





    quest.claimed=true;



    updateRewards(
        quest.rewardXP,
        quest.rewardCoins
    );



    showNotification(
        "🏆 Reward claimed!"
    );



    saveQuests();


    loadQuests();


}







/*=====================================================
                UPDATE USER REWARDS
=====================================================*/


function updateRewards(
    xp,
    coins
){


    const user =
    JSON.parse(
        localStorage.getItem("user")
    );



    if(!user)
        return;



    user.xp += xp;


    user.coins += coins;



    localStorage.setItem(
        "user",
        JSON.stringify(user)
    );


}







/*=====================================================
                SAVE QUESTS
=====================================================*/


function saveQuests(){


    localStorage.setItem(
        "quests",
        JSON.stringify(quests)
    );


}







/*=====================================================
                BUTTON SUPPORT
=====================================================*/


function setupQuestButtons(){


    const buttons =
    document.querySelectorAll(
        ".quest-action"
    );



    buttons.forEach(button=>{


        button.addEventListener(
            "click",
            ()=>{

                loadQuests();

            }
        );


    });


}