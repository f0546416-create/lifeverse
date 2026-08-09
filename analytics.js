/*=====================================================
                ANALYTICS.JS
                LifeVerse Analytics System
=====================================================*/


document.addEventListener("DOMContentLoaded",()=>{


    console.log("📊 Analytics System Loaded");


    loadAnalytics();


});







/*=====================================================
                LOAD ANALYTICS
=====================================================*/


function loadAnalytics(){


    const user =
    JSON.parse(
        localStorage.getItem("user")
    );



    if(!user)
        return;



    const xp =
    user.xp || 0;



    const coins =
    user.coins || 0;




    // Eco calculations

    const carbon =
    (xp * 0.05).toFixed(1);



    const water =
    (xp * 2).toFixed(0);



    const energy =
    (xp * 1.5).toFixed(0);



    const trees =
    Math.floor(
        xp / 500
    );





    updateAnalyticsValue(
        ".carbon-value",
        carbon+" kg"
    );



    updateAnalyticsValue(
        ".water-value",
        water+" L"
    );



    updateAnalyticsValue(
        ".energy-value",
        energy+" kWh"
    );



    updateAnalyticsValue(
        ".trees-value",
        trees
    );



    createChart();


}







/*=====================================================
                UPDATE VALUES
=====================================================*/


function updateAnalyticsValue(
    selector,
    value
){


    const elements =
    document.querySelectorAll(
        selector
    );



    elements.forEach(element=>{


        element.textContent=value;


    });


}








/*=====================================================
                CREATE CHART
=====================================================*/


function createChart(){


    const canvas =
    document.querySelector(
        "#ecoChart"
    );



    if(
        !canvas ||
        typeof Chart === "undefined"
    )
    return;





    new Chart(
        canvas,
        {

            type:"line",


            data:{


                labels:[
                    "Mon",
                    "Tue",
                    "Wed",
                    "Thu",
                    "Fri",
                    "Sat",
                    "Sun"
                ],



                datasets:[

                    {


                    label:
                    "Eco Activity",


                    data:[
                        20,
                        35,
                        50,
                        40,
                        70,
                        85,
                        100
                    ],



                    borderWidth:3


                    }


                ]


            },



            options:{


                responsive:true,


                plugins:{


                    legend:{


                        display:true


                    }


                }


            }


        }


    );


}







/*=====================================================
                MONTHLY REPORT
=====================================================*/


function generateReport(){


    const user =
    JSON.parse(
        localStorage.getItem("user")
    );



    if(!user)
        return;



    const report = {


        xp:user.xp || 0,


        coins:user.coins || 0,


        carbonSaved:
        ((user.xp || 0)*0.05)
        .toFixed(1),


        date:
        new Date()
        .toLocaleDateString()


    };



    localStorage.setItem(
        "ecoReport",
        JSON.stringify(report)
    );



    showNotification(
        "📄 Monthly report created!"
    );


}