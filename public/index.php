<?php

include "includes/zsql.inc.php";
include "includes/func.inc.php";

// Target unificado
$sql = "SELECT * FROM logs ORDER BY id";
$arr = $db->get_results($sql);

foreach($arr as $array) {

    $arrDates[] = $array['date'];
    $arrTarget[] = $array['type'] == 'sell' ? $array['target_price'] : $array['target_price'];
    $arrMarket[] = $array['type'] == 'sell' ? $array['market_price_sell'] : $array['market_price_buy'];

    $arrBaseSell[] = $array['base_price_sell'];
    $arrBaseBuy[] = $array['base_price_buy'];

}





?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Swap Bot Graph</title>
    <link rel="stylesheet" href="styles.css">
    <script src="https://cdn.jsdelivr.net/npm/chart.js@3.3.2/dist/chart.min.js"></script>
    <script src="https://raw.githubusercontent.com/chartjs/Chart.js/master/docs/scripts/utils.js"></script>
</head>
<body>



<canvas id="myChart" width="1768" height="600" style="display: block; box-sizing: border-box; height: 600px; width: 1768px;"></canvas>
<script>
var ctx = document.getElementById('myChart');

var myChart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: [<?php echo "'".implode("','",$arrDates)."'"; ?>],
        datasets: [
            
            {
                label: 'Market',
                data: [<?php echo implode(', ',$arrMarket); ?>],
                backgroundColor: 'rgb(75, 192, 192)',
                borderColor: 'rgb(75, 192, 192)',
                pointRadius: 1,
                tension: 0.1
            },
            {
                label: 'Target',
                data: [<?php echo implode(', ',$arrTarget); ?>],
                backgroundColor: 'orange',
                borderColor: 'orange',
                pointRadius: 1,
                tension: 0.1
            },

            {
                label: 'Base Sell',
                data: [<?php echo implode(', ',$arrBaseSell); ?>],
                backgroundColor: 'rgb(200,200,200)',
                borderColor: 'rgb(200,200,200)',
                pointRadius: 1,
                tension: 0.1
            },
            {
                label: 'Base buy',
                data: [<?php echo implode(', ',$arrBaseBuy); ?>],
                backgroundColor: 'rgb(200,200,200)',
                borderColor: 'rgb(200,200,200)',
                pointRadius: 1,
                tension: 0.1
            },

                        // {
            //     label: 'Base',
            //     data: [<?php echo implode(', ',$arrBase); ?>],
            //     backgroundColor: 'grey',
            //     borderColor: 'grey',
            //     tension: 0.1
            // },
            
            
            
        
        ]
    },
    options: {
        scales: {
            y: {
            ticks: {
                // stepSize: 0.00001
            }
        }
        }
    }
});
</script>


</body>
</html>