// js/attendance_list.js の先頭に追加
import { userStaticInfo } from './user_data.js';

window.addEventListener("DOMContentLoaded", () => {
    // --- DOM要素の取得 ---
    const attendanceTableBody = document.getElementById("attendance-table-body"); // 勤怠一覧テーブルの<tbody>要素

    // --- データ記憶方法の設定 ---
    const USE_LOCAL_STORAGE = false; // sessionStorage を使用 (main.js と合わせる)

    // --- ストレージ選択ヘルパー関数 ---
    const getStorage = () => {
        return USE_LOCAL_STORAGE ? localStorage : sessionStorage;
    };

    // --- 日付を「YYYY-MM-DD」形式の文字列で取得する関数 ---
    const getTodayDateString = (dateObj = new Date()) => {
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };


    // --- 勤怠データを読み込み、テーブルに表示する関数 ---
    const loadAndDisplayAttendanceData = () => {
        const storage = getStorage(); // 使用するストレージを取得
        const savedData = storage.getItem('userAttendanceData'); // ストレージからデータを読み込む
        let userAttendanceData = {}; // 読み込んだデータを格納する変数

        if (savedData) {
            try {
                userAttendanceData = JSON.parse(savedData); // JSON文字列をオブジェクトにパース
            } catch (e) {
                console.error("Failed to parse attendance data from storage:", e);
                userAttendanceData = {}; // パース失敗時は初期化
            }
        }

        // テーブルの既存の内容をクリア
        attendanceTableBody.innerHTML = '';

        // userStaticInfo に定義されている全てのユーザーに対してループ
        // これにより、打刻データがないユーザーでも「未打刻」として行が作成されます
        for (const userId in userStaticInfo) {
            if (userStaticInfo.hasOwnProperty(userId)) {
                const userName = userStaticInfo[userId].name;
                const userDepartment = userStaticInfo[userId].department;

                const userData = userAttendanceData[userId] || {}; // そのユーザーの日付ごとの打刻データ（なければ空オブジェクト）

                // そのユーザーの全ての日付データ、または今日のデータのみを表示するか選択
                // ここでは、データが存在する全ての日付、または今日のデータがない場合は今日の日付のみを考慮します。
                const datesToDisplay = Object.keys(userData).sort(); // 存在する日付をソート
                const todayDate = getTodayDateString();

                // もしそのユーザーに打刻データが全くない、または今日の日付のデータがない場合は、今日の日付を追加
                if (datesToDisplay.length === 0 || !datesToDisplay.includes(todayDate)) {
                    datesToDisplay.push(todayDate);
                    datesToDisplay.sort(); // 再度ソート
                }

                // 各日付に対して行を作成
                datesToDisplay.forEach(date => {
                    const dailyData = userData[date] || { startTime: null, finishTime: null, punchedIn: false }; // 特定の日付の打刻データ（なければ初期値）

                    // 新しい行（tr）を作成
                    const row = document.createElement('tr');

                    // IDのセル (固定値として user ID を使用)
                    const idCell = document.createElement('td');
                    idCell.textContent = userId;
                    row.appendChild(idCell);

                    // 名前のセル (userStaticInfo から取得)
                    const nameCell = document.createElement('td');
                    nameCell.textContent = userName;
                    row.appendChild(nameCell);

                    // 部門のセル (userStaticInfo から取得)
                    const departmentCell = document.createElement('td');
                    departmentCell.textContent = userDepartment;
                    row.appendChild(departmentCell);

                    // 日付のセル (sessionStorage から取得)
                    const dateCell = document.createElement('td');
                    dateCell.textContent = date;
                    row.appendChild(dateCell);

                    // 出勤時刻のセル (sessionStorage から取得)
                    const startTimeCell = document.createElement('td');
                    startTimeCell.textContent = dailyData.startTime || '未打刻';
                    row.appendChild(startTimeCell);

                    // 退勤時刻のセル (sessionStorage から取得)
                    const finishTimeCell = document.createElement('td');
                    finishTimeCell.textContent = dailyData.finishTime || '未打刻';
                    row.appendChild(finishTimeCell);

                    // 詳細ボタンのセル (今回は機能なし、HTMLの構造を維持)
                    const detailCell = document.createElement('td');
                    const detailButton = document.createElement('button');
                    detailButton.textContent = 'View';
                    // 必要に応じてここにクリックイベントを追加できます
                    // detailButton.addEventListener('click', () => { /* 詳細表示ロジック */ });
                    detailCell.appendChild(detailButton);
                    row.appendChild(detailCell);

                    // テーブルの<tbody>に追加
                    attendanceTableBody.appendChild(row);
                });
            }
        }

        // 誰も userStaticInfo に定義されていない場合のメッセージ表示 (任意)
        if (Object.keys(userStaticInfo).length === 0) {
            const noDataRow = document.createElement('tr');
            const noDataCell = document.createElement('td');
            noDataCell.colSpan = 7; // 7列を結合
            noDataCell.textContent = '表示する従業員情報がありません。';
            noDataCell.style.textAlign = 'center';
            noDataRow.appendChild(noDataCell);
            attendanceTableBody.appendChild(noDataRow);
        }
    };

    // --- 初期処理 ---
    loadAndDisplayAttendanceData();
});