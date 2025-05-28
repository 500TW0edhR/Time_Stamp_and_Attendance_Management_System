window.addEventListener("DOMContentLoaded", () => {
    // DOM要素の取得
    const modal = document.getElementById("modal");
    // モーダル内の「閉じる」ボタン（<a>タグの中にあるbutton要素）
    const modalCloseButton = modal.querySelector('a > button');
    const cards = document.querySelectorAll(".card"); // すべてのユーザーカード
    const date_display = document.getElementById("date_display");
    const time_display = document.getElementById("time_display");
    const workButtons = document.querySelectorAll('.work'); // モーダル内の「出勤」と「退勤」ボタン

    // 現在操作中のカードの情報を保持する変数
    let activeCard = null;

    // クリックされた出勤/退勤の情報を一時的に記憶する変数
    let attendanceRecord = {};

    // --- 日付の表示を更新する関数 ---
    const updateDateDisplay = () => {
        let today = new Date();
        let year = today.getFullYear();
        let month = today.getMonth() + 1;
        let week = today.getDay();
        let day = today.getDate();
        let week_ja = ["日", "月", "火", "水", "木", "金", "土"];
        let date = `${year}年${month}月${day}日 (${week_ja[week]}曜日)`;
        date_display.textContent = date;
    };
    updateDateDisplay(); // 初回実行

    // --- 時刻の表示を更新する関数 ---
    const updateTimeDisplay = () => {
        let d = new Date();
        let h = d.getHours();
        let m = d.getMinutes();
        let s = d.getSeconds();

        h = (h < 10) ? '0' + h : h;
        m = (m < 10) ? '0' + m : m;
        s = (s < 10) ? '0' + s : s;

        let time = `${h} : ${m} : ${s}`;
        time_display.textContent = time;
    };
    setInterval(updateTimeDisplay, 1000); // 1秒ごとに更新


    // --- 各カードにクリックイベントリスナーを設定 (モーダルを開くトリガー) ---
    cards.forEach(card => {
        card.addEventListener("click", () => {
            modal.style.display = "block"; // モーダルを表示

            // クリックされたカードを activeCard に保存
            activeCard = card;

            // モーダルが開かれた際、該当カードの現在の勤怠状態に合わせてボタンを有効/無効化する
            const inStatusSpan = activeCard.querySelector(".per .in");
            if (inStatusSpan && inStatusSpan.style.backgroundColor === "rgb(74, 212, 137)") {
                workButtons[0].disabled = true;  // 出勤ボタンを無効化
                workButtons[1].disabled = false; // 退勤ボタンを有効化
            } else {
                workButtons[0].disabled = false; // 出勤ボタンを有効化
                workButtons[1].disabled = true;  // 退勤ボタンを無効化
            }
        });
    });


    // --- モーダルを閉じる処理 (「閉じる」ボタンの場合) ---
    if (modalCloseButton) {
        modalCloseButton.parentNode.addEventListener("click", (event) => {
            event.preventDefault(); // <a>タグのデフォルトのページ遷移を停止
            modal.style.display = "none"; // モーダルを非表示に
            activeCard = null; // activeCard をリセット
            attendanceRecord = {}; // 記録変数もリセット
        });
    }


    // --- モーダル内の「出勤」「退勤」ボタンの処理 ---
    workButtons.forEach(button => {
        button.addEventListener('click', () => {
            const action = button.textContent; // クリックされたボタンのテキスト（"出勤" または "退勤"）

            // activeCard が設定されていることを確認 (どのユーザーの勤怠かを特定)
            if (activeCard) {
                const inSpan = activeCard.querySelector(".per .in");
                const outSpan = activeCard.querySelector(".per .out");
                const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                // ユーザー名も取得
                const userName = activeCard.querySelector('h4') ? activeCard.querySelector('h4').textContent : '不明なユーザー';

                // attendanceRecord 変数に情報を記憶
                attendanceRecord = {
                    userName: userName,
                    action: action,
                    time: currentTime,
                    cardElement: activeCard
                };

                // 出勤ボタンがクリックされた場合
                if (action === "出勤") {
                    workButtons[0].disabled = true;
                    workButtons[1].disabled = false;

                    if (inSpan) inSpan.style.backgroundColor = "#4AD489";
                    if (outSpan) outSpan.style.backgroundColor = "rgb(223, 223, 223)";

                    console.log(`[記録] ${attendanceRecord.userName} が ${attendanceRecord.time} に ${attendanceRecord.action} しました。`);
                    console.log("記憶されたデータ:", attendanceRecord);

                }
                // 退勤ボタンがクリックされた場合
                else if (action === "退勤") {
                    workButtons[0].disabled = false;
                    workButtons[1].disabled = true;

                    if (outSpan) outSpan.style.backgroundColor = "#4AD489";
                    if (inSpan) inSpan.style.backgroundColor = "rgb(223, 223, 223)";

                    console.log(`[記録] ${attendanceRecord.userName} が ${attendanceRecord.time} に ${attendanceRecord.action} しました。`);
                    console.log("記憶されたデータ:", attendanceRecord);
                }

                // ★ここが新しい追加点：出勤・退勤ボタンクリック後にモーダルを閉じる
                modal.style.display = "none";
                activeCard = null; // activeCard もリセット
                attendanceRecord = {}; // 記録変数もリセット
            } else {
                console.warn("エラー: activeCardが設定されていません。モーダルが予期せず開かれた可能性があります。");
            }
        });
    });
});