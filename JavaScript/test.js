window.addEventListener("DOMContentLoaded", () => {

    const modalOpenButtons = document.querySelectorAll(".modalOpen"); // 各カード内の「Profile」ボタン
    const modal = document.getElementById("modal");
    // HTMLのモーダル内の「閉じる」ボタンは<a>タグに囲まれているので、その中のbutton要素を取得
    const modalCloseButton = modal.querySelector('a > button'); 

    const cards = document.querySelectorAll(".card"); // すべてのユーザーカード

    const date_display = document.getElementById("date_display");
    const time_display = document.getElementById("time_display");

    const workButtons = document.querySelectorAll('.work'); // モーダル内の「出勤」と「退勤」ボタン

    // ★現在操作中のカードを保持するための変数
    let activeCard = null;

    // --- 日付の表示 ---
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
    updateDateDisplay(); // 最初に表示

    // --- 時刻の表示 ---
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


    // --- モーダルを開く処理 ---
    // 各「Profile」ボタンにイベントリスナーを設定
    modalOpenButtons.forEach(button => {
        button.addEventListener("click", () => {
            modal.style.display = "block";
            
            // ★クリックされた「Profile」ボタンの親であるカード要素を取得し、activeCardに保存
            activeCard = button.closest('.card');
            
            // console.log("モーダルを開いたカード:", activeCard); // デバッグ用

            // モーダルが開かれた際に、該当カードの現在の状態（出勤中か退勤中か）を反映させる
            const inStatusSpan = activeCard.querySelector(".per .in");
            // const outStatusSpan = activeCard.querySelector(".per .out"); // 現在使ってないが念のため

            // 出勤ステータスの背景色をチェック (CSSの#4AD489がrgb(74, 212, 137)になるため)
            if (inStatusSpan.style.backgroundColor === "rgb(74, 212, 137)") {
                workButtons[0].disabled = true;  // 出勤ボタンを無効化
                workButtons[1].disabled = false; // 退勤ボタンを有効化
            } else {
                workButtons[0].disabled = false; // 出勤ボタンを有効化
                workButtons[1].disabled = true;  // 退勤ボタンを無効化
            }
        });
    });

    // --- モーダルを閉じる処理 ---
    // 「閉じる」ボタン（<a>タグの中にある）の親要素にイベントリスナーを設定
    // HTMLで<a>タグにhrefが指定されているので、preventDefaultで遷移を止める
    modalCloseButton.parentNode.addEventListener("click", (event) => {
        event.preventDefault(); // デフォルトのリンク遷移を停止
        modal.style.display = "none"; // モーダルを非表示に
        activeCard = null; // ★操作中のカード情報をリセット
    });


    // --- モーダル内の「出勤」「退勤」ボタンの処理 ---
    workButtons.forEach(button => {
        button.addEventListener('click', () => {
            const action = button.textContent; // クリックされたボタンのテキスト（"出勤" または "退勤"）

            // ★activeCard が設定されていることを確認（どのユーザーの勤怠か）
            if (activeCard) {
                const inSpan = activeCard.querySelector(".per .in"); // そのカード内の出勤ステータス
                const outSpan = activeCard.querySelector(".per .out"); // そのカード内の退勤ステータス
                const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); // 現在時刻

                // 出勤ボタンがクリックされた場合
                if (action === "出勤") {
                    workButtons[0].disabled = true;  // 出勤ボタンを無効化
                    workButtons[1].disabled = false; // 退勤ボタンを有効化

                    inSpan.style.backgroundColor = "#4AD489"; // 出勤ステータスを緑に
                    outSpan.style.backgroundColor = "rgb(223, 223, 223)"; // 退勤ステータスをデフォルト色にリセット

                    const userName = activeCard.querySelector('h4').textContent;
                    console.log(`${userName} が ${currentTime} に出勤しました。`);
                    // ★ここに、出勤時刻を記録するさらなるロジック（例：隠しフィールドへの保存、サーバーへの送信など）を追加できます。

                } 
                // 退勤ボタンがクリックされた場合
                else if (action === "退勤") {
                    workButtons[0].disabled = false; // 出勤ボタンを有効化
                    workButtons[1].disabled = true;  // 退勤ボタンを無効化

                    outSpan.style.backgroundColor = "#4AD489"; // 退勤ステータスを緑に
                    inSpan.style.backgroundColor = "rgb(223, 223, 223)"; // 出勤ステータスをデフォルト色にリセット

                    const userName = activeCard.querySelector('h4').textContent;
                    console.log(`${userName} が ${currentTime} に退勤しました。`);
                    // ★ここに、退勤時刻を記録するさらなるロジックを追加できます。
                }
            } else {
                // activeCardがnullの場合（通常は発生しないはずだが、念のため）
                console.warn("エラー: activeCardが設定されていません。モーダルが予期せず開かれた可能性があります。");
            }
        });
    });
});