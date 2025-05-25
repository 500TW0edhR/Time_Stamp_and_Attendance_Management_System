window.addEventListener("DOMContentLoaded", () => {

    const modalOpen = document.querySelectorAll(".modalOpen");
    console.log(modalOpen);

    const modal = document.getElementById("modal");

    for (m = 0; m < modalOpen.length; m++) {

        modalOpen[m].addEventListener("click", () => {
            modal.style.display = "block";
        });
    }


    const date_stamp = document.getElementById("date_display");
    const time_stamp = document.getElementById("time_display");

    const start = document.querySelector(".start_time");
    const finish = document.querySelector(".finish_time");
    // console.log(finish);

    const workButtons = document.querySelectorAll('.work');
    const timeStampList = document.querySelector('.time_stamp dl');

    // console.log();





    //今日の日付データを変数に格納
    let today = new Date();

    //年・月・日・曜日を取得
    let year = today.getFullYear();
    let month = today.getMonth() + 1;
    let week = today.getDay();
    let day = today.getDate();

    let week_ja = new Array("日", "月", "火", "水", "木", "金", "土");

    let date = (year + "年" + month + "月" + day + "日 " + "(" + week_ja[week] + "曜日)");

    //年・月・日・曜日をHTMLに反映
    date_display.textContent = date;


    // 時刻用関数
    setInterval(() => {

        // 各種時間を取得
        let d = new Date();
        let h = d.getHours();
        let m = d.getMinutes();
        let s = d.getSeconds();

        if (h < 10) {
            h = '0' + h;
        }

        if (m < 10) {
            m = '0' + m;
        }

        if (s < 10) {
            s = '0' + s;
        }

        // 時分秒を:を挟んで組み合わせる
        let time = h + ' : ' + m + ' : ' + s;

        // HTMLに表示
        time_display.textContent = time;
    }, 1000);

});