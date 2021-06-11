
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta http-equiv="refresh" content="60">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Swap Bot Graph</title>
    <link rel="stylesheet" href="styles.css">
    <script src="https://cdn.jsdelivr.net/npm/chart.js@3.3.2/dist/chart.min.js"></script>
    <script src="https://raw.githubusercontent.com/chartjs/Chart.js/master/docs/scripts/utils.js"></script>
</head>
<body>



<canvas id="myChart" width="1700" height="600" style="display: block; box-sizing: border-box; height: 600px; width: 1700px;"></canvas>
<script>
var ctx = document.getElementById('myChart');

<?php

include "includes/zsql.inc.php";
include "includes/func.inc.php";

$sql = "SELECT type FROM trades ORDER BY id DESC LIMIT 1";
$type = $db->get_var($sql);

$type = $type == 'SELL' ? 'buy' : 'sell';

// Target unificado
$sql = "SELECT * FROM logs WHERE type = '$type' ORDER BY id DESC";
$sql = "SELECT * FROM logs WHERE 1 ORDER BY id DESC LIMIT 200";
$arr = $db->get_results($sql);


foreach($arr as $array) {

    $arrDates[] = $array['date'];

    $arrTarget[] = $array['target_price'];
    $arrMarket[] = $array['market_price'];
    $arrBase[] = $array['base_price'];

    $arrTarget1[] = ($array['base_price']+$array['target_price'])/2;
}

?>

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
                label: 'Target 1/2',
                data: [<?php echo implode(', ',$arrTarget1); ?>],
                backgroundColor: 'rgb(251,223,172)',
                borderColor: 'rgb(251,223,172)',
                pointRadius: 1,
                tension: 0.1
            },

            {
                label: 'Base',
                data: [<?php echo implode(', ',$arrBase); ?>],
                backgroundColor: 'rgb(200,200,200)',
                borderColor: 'rgb(200,200,200)',
                pointRadius: 1,
                tension: 0.1
            },





            
            
            
        
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