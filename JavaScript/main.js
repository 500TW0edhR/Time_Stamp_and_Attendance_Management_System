window.addEventListener("DOMContentLoaded", () => {
    // --- DOM要素の取得 ---
    // HTML内の要素をJavaScriptで操作するために、それぞれの要素を定数として取得します。
    // modal: 打刻詳細を表示するポップアップウィンドウ全体
    const modal = document.getElementById("modal");
    // cards: 各従業員の打刻カード（複数あるのでquerySelectorAllで全て取得）
    const cards = document.querySelectorAll(".card");
    // date_display: 日付を表示するHTML要素
    const date_display = document.getElementById("date_display");
    // time_display: 時刻を表示するHTML要素
    const time_display = document.getElementById("time_display");
    // punchInButton: モーダル内の「出勤」ボタン
    const punchInButton = document.querySelector('.work.punch-in');
    // punchOutButton: モーダル内の「退勤」ボタン
    const punchOutButton = document.querySelector('.work.punch-out');
    // modalStartTimeDisplay: モーダル内の出勤時刻表示部分
    const modalStartTimeDisplay = document.querySelector('.start_time_modal');
    // modalFinishTimeDisplay: モーダル内の退勤時刻表示部分
    const modalFinishTimeDisplay = document.querySelector('.finish_time_modal');

    // --- ★★ データ記憶方法の設定 ★★ ---
    // true: localStorage を使用。ブラウザを閉じてもデータがPCに残る永続記憶。
    // false: sessionStorage を使用。タブを閉じるとデータがリセットされる一時記憶。
    // 今回は「false」に設定し、sessionStorage を使います。
    const USE_LOCAL_STORAGE = false;

    // 各ユーザーの、日付ごとの出退勤データを保持するオブジェクト。
    // 例: {
    //   "user1": {  // ユーザーID
    //     "2025-05-28": { startTime: "09:00", finishTime: "18:00", punchedIn: true }, // 日付ごとのデータ
    //     "2025-05-27": { startTime: "09:30", finishTime: "17:30", punchedIn: true }
    //   },
    //   "user2": { ... } // 別のユーザー
    // }
    let userAttendanceData = {};

    // 現在モーダルが開いている従業員のユーザーIDを一時的に保持する変数。
    // モーダルが閉じると null にリセットされます。
    let currentUserId = null;

    // --- ストレージ選択ヘルパー関数 ---
    // USE_LOCAL_STORAGE の設定に応じて、localStorage か sessionStorage オブジェクトを返します。
    // これにより、データの読み書き先を簡単に切り替えられます。
    const getStorage = () => {
        return USE_LOCAL_STORAGE ? localStorage : sessionStorage;
    };

    // --- 今日の日付を「YYYY-MM-DD」形式の文字列で取得する関数 ---
    // 打刻データを日付ごとに管理するために使います。
    const getTodayDateString = () => {
        const today = new Date(); // 現在の日付と時刻を取得
        const year = today.getFullYear(); // 年 (例: 2025)
        // 月 (0-11なので+1)。padStart(2, '0')で2桁表示 (例: 5 -> 05)
        const month = String(today.getMonth() + 1).padStart(2, '0');
        // 日。padStart(2, '0')で2桁表示 (例: 8 -> 08)
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`; // 例: "2025-05-28"
    };

    // --- 時刻を「HH:MM」形式の文字列で取得する関数 ---
    // 打刻時刻として記録するために使います。
    const getCurrentTimeString = () => {
        const now = new Date(); // 現在の日付と時刻を取得
        // 時。padStart(2, '0')で2桁表示
        const h = String(now.getHours()).padStart(2, '0');
        // 分。padStart(2, '0')で2桁表示
        const m = String(now.getMinutes()).padStart(2, '0');
        return `${h}:${m}`; // 例: "09:30"
    };


    // --- データ記憶の初期化と読み込み ---
    // ページが読み込まれた際に、ストレージから打刻データを読み込むか、初期状態を準備します。
    const initializeAttendanceData = () => {
        const storage = getStorage(); // localStorage または sessionStorage を取得
        const savedData = storage.getItem('userAttendanceData'); // ストレージから 'userAttendanceData' キーでデータを読み込む

        if (savedData) { // もし保存されたデータがあれば
            try {
                // JSON形式の文字列をJavaScriptオブジェクトに変換して userAttendanceData に格納
                userAttendanceData = JSON.parse(savedData);
            } catch (e) {
                // JSONのパースに失敗した場合（データが壊れているなど）のエラー処理
                console.error("Failed to parse userAttendanceData from storage:", e);
                userAttendanceData = {}; // 安全のためデータを空のオブジェクトに初期化
            }
        }

        // 全ての打刻カード（従業員）をループ処理
        cards.forEach(card => {
            const userId = card.dataset.userId; // カードの data-user-id 属性からユーザーIDを取得

            // そのユーザーのデータが userAttendanceData にまだ存在しない場合、初期化
            if (userId && !userAttendanceData[userId]) {
                // ユーザーIDをキーとして、日付ごとの打刻データを格納するための空のオブジェクトを作成
                userAttendanceData[userId] = {};
            }
            // 各カードの表示状態を最新のデータに基づいて更新します。
            // (例: ページリロード時に、保存されていた出勤時刻をカードに反映)
            updateCardDisplay(userId);
        });
    };

    // --- データ保存 ---
    // userAttendanceData オブジェクトの内容をストレージに保存する関数です。
    const saveAttendanceData = () => {
        const storage = getStorage(); // localStorage または sessionStorage を取得
        // userAttendanceData オブジェクトをJSON文字列に変換してストレージに保存
        storage.setItem('userAttendanceData', JSON.stringify(userAttendanceData));
    };

    // --- 日付表示の更新 ---
    // ページのヘッダーなどに表示される日付を現在の日付に更新します。
    const updateDateDisplay = () => {
        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth() + 1; // 月は0から始まるので+1
        const week = today.getDay(); // 曜日 (0:日, 1:月...)
        const day = today.getDate();
        const week_ja = ["日", "月", "火", "水", "木", "金", "土"]; // 曜日を日本語に変換するための配列
        // 表示する日付文字列を生成 (例: "2025年5月28日 (水曜日)")
        const date = `${year}年${month}月${day}日 (${week_ja[week]}曜日)`;
        date_display.textContent = date; // 取得したDOM要素にテキストをセット
    };
    updateDateDisplay(); // ページ読み込み時に一度、日付を表示します。

    // --- 時刻表示の更新 ---
    // ページのヘッダーなどに表示される時刻をリアルタイムで更新します（時計機能）。
    const updateTimeDisplay = () => {
        const d = new Date();
        // 時、分、秒を取得し、String().padStart(2, '0')で2桁表示に整形 (例: 5 -> 05)
        const h = String(d.getHours()).padStart(2, '0');
        const m = String(d.getMinutes()).padStart(2, '0');
        const s = String(d.getSeconds()).padStart(2, '0');
        const time = `${h} : ${m} : ${s}`; // 例: "11 : 45 : 30"
        time_display.textContent = time; // 取得したDOM要素にテキストをセット
    };
    setInterval(updateTimeDisplay, 1000); // 1000ミリ秒（1秒）ごとに updateTimeDisplay 関数を繰り返し実行


    // ### 変更点: `updateCardDisplay` 関数
    // この関数内の `userDataForToday` の取得ロジックを修正しました。
    // 以前は `userAttendanceData[userId]` が存在していても、その中の `[todayDate]` のデータが存在しない場合にエラーが出ていました。
    // 新しいロジックでは、`userAttendanceData[userId]` **かつ** `userAttendanceData[userId][todayDate]` が存在する場合にのみデータを取得し、それ以外の場合は安全に初期値を設定します。

    // --- カード上の出退勤表示を更新する関数 ---
    // 各従業員の打刻カードの表示（出勤・退勤時刻、背景色）を、現在のデータに基づいて更新します。
    const updateCardDisplay = (userId) => {
        const card = document.querySelector(`.card[data-user-id="${userId}"]`); // 指定されたユーザーIDのカード要素を取得
        if (!card) return; // カードが見つからなければ何もしない

        const todayDate = getTodayDateString(); // 今日の日付を取得

        // ユーザーデータが存在しない場合も考慮し、デフォルト値を設定
        // userAttendanceData[userId] が存在し、かつ userAttendanceData[userId][todayDate] が存在すればそのデータを使う
        // それ以外の場合は、初期値（まだ打刻していない状態）を設定
        const userDataForToday = (userAttendanceData[userId] && userAttendanceData[userId][todayDate]) ? userAttendanceData[userId][todayDate] : {
            startTime: null,
            finishTime: null,
            punchedIn: false
        };

        const inSpan = card.querySelector(".per .in"); // カード内の出勤表示部分
        const outSpan = card.querySelector(".per .out"); // カード内の退勤表示部分

        if (inSpan) {
            // 出勤時刻があればその時刻を表示、なければ「出勤」と表示
            inSpan.textContent = userDataForToday.startTime ? `出勤: ${userDataForToday.startTime}` : '出勤';
            // 出勤済みなら背景を緑色に、そうでなければグレーに設定
            inSpan.style.backgroundColor = userDataForToday.punchedIn ? "#00FF33" : "rgb(223, 223, 223)";
        }
        if (outSpan) {
            // 退勤時刻があればその時刻を表示、なければ「退勤」と表示
            outSpan.textContent = userDataForToday.finishTime ? `退勤: ${userDataForToday.finishTime}` : '退勤';
            // 退勤時刻があれば背景を緑色に、そうでなければグレーに設定
            outSpan.style.backgroundColor = userDataForToday.finishTime ? "#00FF33" : "rgb(223, 223, 223)";
        }
    };


    // --- モーダルを開く処理 ---
    // 各打刻カードがクリックされたときに、詳細モーダルを表示します。
    cards.forEach(card => { // 全てのカードをループ
        card.addEventListener("click", () => { // 各カードにクリックイベントリスナーを追加
            currentUserId = card.dataset.userId; // クリックされたカードのユーザーIDを記録
            const todayDate = getTodayDateString(); // 今日の日付を取得

            // 現在選択されているユーザーの今日の打刻データを取得します。
            // データがまだなければ、初期値（未打刻状態）を設定します。
            const userDataForToday = userAttendanceData[currentUserId][todayDate] || {
                startTime: null,
                finishTime: null,
                punchedIn: false
            };

            // モーダル内のボタンの状態を更新
            // 既に出勤済みなら「出勤」ボタンを無効化 (二重打刻防止)
            punchInButton.disabled = userDataForToday.punchedIn;
            // 出勤済み かつ 退勤済みでない場合のみ「退勤」ボタンを有効化
            punchOutButton.disabled = !userDataForToday.punchedIn || userDataForToday.finishTime !== null;

            // モーダル内の出勤/退勤時刻表示を更新
            modalStartTimeDisplay.textContent = userDataForToday.startTime ? `出勤: ${userDataForToday.startTime}` : '出勤: --:--';
            modalFinishTimeDisplay.textContent = userDataForToday.finishTime ? `退勤: ${userDataForToday.finishTime}` : '退勤: --:--';

            modal.style.display = "flex"; // モーダルを表示 (CSSのdisplayプロパティを変更)
        });
    });

    // --- モーダルを閉じる処理 ---
    // Escキーが押されたときにモーダルを閉じます。
    document.addEventListener('keydown', (event) => {
        // Escキーが押され、かつモーダルが表示されている場合
        if (event.key === 'Escape' && modal.style.display === 'flex') {
            modal.style.display = 'none'; // モーダルを非表示にする
            currentUserId = null; // 選択中のユーザーIDをリセット
        }
    });

    // モーダルの背景部分がクリックされたときにモーダルを閉じます。
    modal.addEventListener('click', (event) => {
        // クリックされた要素がモーダルの背景部分（モーダルコンテンツ自体ではない）である場合
        if (event.target === modal) {
            modal.style.display = 'none'; // モーダルを非表示にする
            currentUserId = null; // 選択中のユーザーIDをリセット
        }
    });

    // --- モーダル内の「出勤」ボタンの処理 ---
    punchInButton.addEventListener('click', () => {
        if (currentUserId) { // 現在選択中のユーザーがいることを確認
            const todayDate = getTodayDateString(); // 今日の日付を取得

            // userAttendanceData にそのユーザーの今日の日付のデータがなければ、新しく作成
            // userAttendanceData[currentUserId] がまだ存在しない場合も考慮
            if (!userAttendanceData[currentUserId]) {
                userAttendanceData[currentUserId] = {}; // ユーザーごとのオブジェクトを初期化
            }
            if (!userAttendanceData[currentUserId][todayDate]) {
                userAttendanceData[currentUserId][todayDate] = {
                    startTime: null,
                    finishTime: null,
                    punchedIn: false
                };
            }
            const userDataForToday = userAttendanceData[currentUserId][todayDate]; // 今日のユーザーの打刻データを取得

            if (!userDataForToday.punchedIn) { // まだ出勤していない場合のみ処理を実行
                const time = getCurrentTimeString(); // 現在時刻を取得

                userDataForToday.startTime = time; // 出勤時刻を記録
                userDataForToday.punchedIn = true; // 出勤済みフラグをtrueに

                modalStartTimeDisplay.textContent = `出勤: ${time}`; // モーダル内の表示を更新
                punchInButton.disabled = true; // 「出勤」ボタンを無効化
                punchOutButton.disabled = false; // 「退勤」ボタンを有効化 (出勤したので)

                updateCardDisplay(currentUserId); // カードの表示を更新
                saveAttendanceData(); // データをストレージに保存
                console.log(`User ${currentUserId} が ${todayDate} ${time} に出勤しました。`); // コンソールにログを出力

                // 出勤打刻が完了したらモーダルを閉じる
                modal.style.display = "none";
                currentUserId = null;
            }
        } else {
            console.warn("エラー: activeCardが設定されていません。出勤打刻できません。");
        }
    });

    // --- モーダル内の「退勤」ボタンの処理 ---
    punchOutButton.addEventListener('click', () => {
        if (currentUserId) { // 現在選択中のユーザーがいることを確認
            const todayDate = getTodayDateString(); // 今日の日付を取得

            // userAttendanceData[currentUserId] が存在しない、または userAttendanceData[currentUserId][todayDate] が存在しない場合は、
            // 退勤できない状態とみなし、処理を続行しない
            if (!userAttendanceData[currentUserId] || !userAttendanceData[currentUserId][todayDate]) {
                console.warn(`User ${currentUserId} の ${todayDate} の出勤データが見つかりません。退勤できません。`);
                return; // ここで処理を終了
            }

            const userDataForToday = userAttendanceData[currentUserId][todayDate]; // 今日のユーザーの打刻データを取得

            // 既に出勤済みで、かつまだ退勤していない場合のみ処理を実行
            if (userDataForToday.punchedIn && userDataForToday.finishTime === null) {
                const time = getCurrentTimeString(); // 現在時刻を取得

                userDataForToday.finishTime = time; // 退勤時刻を記録

                modalFinishTimeDisplay.textContent = `退勤: ${time}`; // モーダル内の表示を更新
                punchOutButton.disabled = true; // 「退勤」ボタンを無効化
                punchInButton.disabled = true; // その日の「出勤」ボタンも無効化 (二重打刻防止)

                updateCardDisplay(currentUserId); // カードの表示を更新
                saveAttendanceData(); // データをストレージに保存
                console.log(`User ${currentUserId} が ${todayDate} ${time} に退勤しました。`); // コンソールにログを出力

                // 退勤打刻が完了したらモーダルを閉じる
                modal.style.display = "none";
                currentUserId = null;
            }
        } else {
            console.warn("エラー: activeCardが設定されていません。退勤打刻できません。");
        }
    });

    // --- 初期化処理を実行 ---
    // ページが完全に読み込まれた後、最初にこの関数を実行してデータを準備します。
    initializeAttendanceData();
});