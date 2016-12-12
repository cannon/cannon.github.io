<?php
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    system("\"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe\" \"http://localhost/brass/circlepacking#autorun\"");
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
	if (!isset($_POST['cmd'])) { die('{"error":"no command"}'); }
	switch($_POST['cmd']) {

		case "GET_TEST_DATA":
			if (!isset($_POST['test'])) { die('{"error":"no test name"}'); }
			if (!file_exists("data/".$_POST['test'].".json")) { die('{"error":"invalid test name '.$_POST['test'].'"}'); }
			$test = json_decode(file_get_contents("data/".$_POST['test'].".json"),true);
			$test["test_name"]=$_POST['test'];
			$test["test_run_id"]=time();
   		echo json_encode($test);
   		break;

		case "REPORT_TEST_DATA":
			if (!isset($_POST['results'])) { die('{"error":"no results"}'); }
			$results = json_decode($_POST['results'],true);
			file_put_contents("log/".$results['test_name']."-".$results['test_run_id'].".json", json_encode($results['timings']));
			break;

		default:
			die('{"error":"invalid command"}');
	}
}


?>