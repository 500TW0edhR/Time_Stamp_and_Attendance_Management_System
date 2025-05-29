// js/index.js (または main2.js) の先頭に追加
import { userStaticInfo } from './user_data.js';

window.addEventListener("DOMContentLoaded", () => {

    // --- DOM要素の取得 ---
    const modal = document.getElementById("modal");
    // cards: これは動的に生成されるので、ここでは初期値としてnullまたは空のNodeListを設定します
    let cards = []; // DOMContentLoaded後に改めて取得するため、letで宣言
    const usersContainer = document.querySelector(".users"); // カードを動的に追加するコンテナ要素

    const date_display = document.getElementById("date_display");
    const time_display = document.getElementById("time_display");
    const punchInButton = document.querySelector('.work.punch-in');
    const punchOutButton = document.querySelector('.work.punch-out');
    const modalStartTimeDisplay = document.querySelector('.start_time_modal');
    const modalFinishTimeDisplay = document.querySelector('.finish_time_modal');


    // --- ★★ データ記憶方法の設定 ★★ ---
    // localStorage は不使用 sessionStorage を使用するように設定 (false)
    const USE_LOCAL_STORAGE = false; // localStorage を使用

    let userAttendanceData = {}; // 全ユーザーの勤怠データを保持するオブジェクト
    let currentUserId = null; // 現在モーダルが開いている従業員のユーザーID

    // --- ストレージ選択ヘルパー関数 ---
    const getStorage = () => {
        return USE_LOCAL_STORAGE ? localStorage : sessionStorage;
    };

    // --- 今日の日付を「YYYY-MM-DD」形式の文字列で取得する関数 ---
    const getTodayDateString = () => {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // --- 時刻を「HH:MM」形式の文字列で取得する関数 ---
    const getCurrentTimeString = () => {
        const now = new Date();
        const h = String(now.getHours()).padStart(2, '0');
        const m = String(now.getMinutes()).padStart(2, '0');
        const s = String(now.getSeconds()).padStart(2, '0');
        return `${h}:${m}`;
    };

    // --- データ記憶の初期化と読み込み ---
    const initializeAttendanceData = () => {
        const storage = getStorage();
        const savedData = storage.getItem('userAttendanceData');

        if (savedData) {
            try {
                userAttendanceData = JSON.parse(savedData);
            } catch (e) {
                console.error("Failed to parse userAttendanceData from storage:", e);
                userAttendanceData = {};
            }
        }

        // ★★★ 変更点: カードを動的に生成するロジック ★★★
        usersContainer.innerHTML = ''; // 既存のカードを全てクリア（念のため）

        // userStaticInfoの各ユーザーに対してカードを生成
        for (const userId in userStaticInfo) {
            if (Object.hasOwnProperty.call(userStaticInfo, userId)) {
                const userInfo = userStaticInfo[userId];

                // ユーザーIDのデータが userAttendanceData にまだ存在しない場合、初期化
                if (!userAttendanceData[userId]) {
                    userAttendanceData[userId] = {};
                }

                // カード要素を作成
                const card = document.createElement('div');
                card.classList.add('card');
                card.dataset.userId = userId; // data-user-idを設定

                // カードの中身をinnerHTMLで設定
                card.innerHTML = `
                    <i class="fa-solid fa-user fa-2x"></i>
                    <h4>${userInfo.name}</h4>
                    <p>${userInfo.department}</p>
                    <div class="per">
                        <span class="in">出勤</span>
                        <span class="out">退勤</span>
                    </div>
                `;

                // カードをコンテナに追加
                usersContainer.appendChild(card);

                // 各カードのクリックイベントリスナーを設定
                // ここで設定しないと、動的に生成されたカードはクリックイベントに応答しません
                card.addEventListener("click", () => {
                    currentUserId = card.dataset.userId;
                    const todayDate = getTodayDateString();

                    const userDataForToday = userAttendanceData[currentUserId][todayDate] || {
                        startTime: null,
                        finishTime: null,
                        punchedIn: false
                    };

                    const modalUserNameElement = modal.querySelector('.modal-user-name');
                    const modalDepartmentElement = modal.querySelector('.modal-department');

                    const user = userStaticInfo[currentUserId];
                    if (modalUserNameElement) modalUserNameElement.textContent = user ? user.name : '不明なユーザー';
                    if (modalDepartmentElement) modalDepartmentElement.textContent = user ? user.department : '不明な部門';

                    punchInButton.disabled = userDataForToday.punchedIn;
                    punchOutButton.disabled = !userDataForToday.punchedIn || userDataForToday.finishTime !== null;

                    modalStartTimeDisplay.textContent = userDataForToday.startTime ? `出勤: ${userDataForToday.startTime}` : '出勤: --:--';
                    modalFinishTimeDisplay.textContent = userDataForToday.finishTime ? `退勤: ${userDataForToday.finishTime}` : '退勤: --:--';

                    modal.style.display = "flex";
                });
            }
        }
        // cards 変数を動的に生成された全てのカードで更新
        cards = document.querySelectorAll(".card");

        // 全てのカードが生成された後で、それぞれの打刻状態を更新
        cards.forEach(card => {
            updateCardDisplay(card.dataset.userId);
        });
    };
    // ★★★ 変更点ここまで ★★★


    // --- データ保存 ---
    const saveAttendanceData = () => {
        const storage = getStorage();
        storage.setItem('userAttendanceData', JSON.stringify(userAttendanceData));
    };

    // --- 日付表示の更新 ---
    const updateDateDisplay = () => {
        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth() + 1;
        const week = today.getDay();
        const day = today.getDate();
        const week_ja = ["日", "月", "火", "水", "木", "金", "土"];
        const date = `${year}年${month}月${day}日 (${week_ja[week]}曜日)`;
        date_display.textContent = date;
    };
    updateDateDisplay();

    // --- 時刻表示の更新 ---
    const updateTimeDisplay = () => {
        const d = new Date();
        const h = String(d.getHours()).padStart(2, '0');
        const m = String(d.getMinutes()).padStart(2, '0');
        const s = String(d.getSeconds()).padStart(2, '0');
        const time = `${h} : ${m} : ${s}`;
        time_display.textContent = time;
    };
    setInterval(updateTimeDisplay, 1000);

    // --- カード上の出退勤表示を更新する関数 ---
    const updateCardDisplay = (userId) => {
        const card = document.querySelector(`.card[data-user-id="${userId}"]`);
        if (!card) return;

        const todayDate = getTodayDateString();
        const userDataForToday = (userAttendanceData[userId] && userAttendanceData[userId][todayDate]) ? userAttendanceData[userId][todayDate] : {
            startTime: null,
            finishTime: null,
            punchedIn: false
        };

        const inSpan = card.querySelector(".per .in");
        const outSpan = card.querySelector(".per .out");

        if (inSpan) {
            inSpan.textContent = userDataForToday.startTime ? `出勤: ${userDataForToday.startTime}` : '出勤';
            inSpan.style.backgroundColor = userDataForToday.punchedIn ? "#00FF33" : "rgb(223, 223, 223)";
        }
        if (outSpan) {
            outSpan.textContent = userDataForToday.finishTime ? `退勤: ${userDataForToday.finishTime}` : '退勤';
            outSpan.style.backgroundColor = userDataForToday.finishTime ? "#00FF33" : "rgb(223, 223, 223)";
        }
    };

    // --- モーダルを閉じる処理 ---
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && modal.style.display === 'flex') {
            modal.style.display = 'none';
            currentUserId = null;
        }
    });

    modal.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
            currentUserId = null;
        }
    });

    // --- モーダル内の「出勤」ボタンの処理 ---
    punchInButton.addEventListener('click', () => {
        if (currentUserId) {
            const todayDate = getTodayDateString();

            if (!userAttendanceData[currentUserId]) {
                userAttendanceData[currentUserId] = {};
            }
            if (!userAttendanceData[currentUserId][todayDate]) {
                userAttendanceData[currentUserId][todayDate] = {
                    startTime: null,
                    finishTime: null,
                    punchedIn: false
                };
            }
            const userDataForToday = userAttendanceData[currentUserId][todayDate];

            if (!userDataForToday.punchedIn) {
                const time = getCurrentTimeString();
                const user = userStaticInfo[currentUserId] || { name: '不明なユーザー', department: '不明な部門' };

                userDataForToday.startTime = time;
                userDataForToday.punchedIn = true;
                userDataForToday.userName = user.name;
                userDataForToday.department = user.department;
                userDataForToday.timestamp = new Date().toISOString();


                modalStartTimeDisplay.textContent = `出勤: ${time}`;
                punchInButton.disabled = true;
                punchOutButton.disabled = false;

                updateCardDisplay(currentUserId); // カードの表示を更新
                saveAttendanceData();
                console.log(`User ${currentUserId} (${user.name}, ${user.department}) が ${todayDate} ${time} に出勤しました。`);

                modal.style.display = "none";
                currentUserId = null;
            }
        } else {
            console.warn("エラー: activeCardが設定されていません。出勤打刻できません。");
        }
    });

    // --- モーダル内の「退勤」ボタンの処理 ---
    punchOutButton.addEventListener('click', () => {
        if (currentUserId) {
            const todayDate = getTodayDateString();

            if (!userAttendanceData[currentUserId] || !userAttendanceData[currentUserId][todayDate]) {
                console.warn(`User ${currentUserId} の ${todayDate} の出勤データが見つかりません。退勤できません。`);
                return;
            }

            const userDataForToday = userAttendanceData[currentUserId][todayDate];

            if (userDataForToday.punchedIn && userDataForToday.finishTime === null) {
                const time = getCurrentTimeString();
                const user = userStaticInfo[currentUserId] || { name: '不明なユーザー', department: '不明な部門' };

                userDataForToday.finishTime = time;
                userDataForToday.timestamp = new Date().toISOString();


                modalFinishTimeDisplay.textContent = `退勤: ${time}`;
                punchOutButton.disabled = true;
                punchInButton.disabled = true;

                updateCardDisplay(currentUserId); // カードの表示を更新
                saveAttendanceData();
                console.log(`User ${currentUserId} (${user.name}, ${user.department}) が ${todayDate} ${time} に退勤しました。`);

                modal.style.display = "none";
                currentUserId = null;
            }
        } else {
            console.warn("エラー: activeCardが設定されていません。退勤打刻できません。");
        }
    });

    // --- 初期化処理を実行 ---
    initializeAttendanceData();
});