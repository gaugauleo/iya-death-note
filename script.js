"use strict";

/* ================================================================
   01 何も入力されなかったときの「嫌因」30件
   Math.random()で、この30件から1つを選ぶ。
   ================================================================ */
const RANDOM_REASONS = [
    "靴下を履こうとしたら、片方だけ全て行方不明になる。",
    "道の信号が全て、直前で赤になる。",
    "交差点の真ん中で盛大に尻もちをつく。",
    "楽しみにしていたプリンをだれかに勝手に食べられる。",
    "いくら待ってもエレベーターが永遠に来ない。",
    "買い物に行った帰り道、袋が破けて中身をぶちまける。",
    "洋服のタグがぶら下がっていることに気づかないまま、一日過ごしてしまう。",
    "買ったばかりのスマホを落として画面がバキバキになる。",
    "煮詰まった会議中に、盛大にオナラが出る。",
    "大きな方でトイレに駆け込んだら、トイレットペーパーがない。",
    "カラオケで自分の番になった瞬間、しゃっくりが止まらなくなる。",
    "雨が降り、買ったばかりの傘を一瞬で盗まれる。",
    "お気に入りの白いシャツを着て出かけ、盛大に醤油をこぼす。",
    "写真撮影で、自分だけ全てのショットが半目で写る。",
    "ベッドに入って眠くなった瞬間、猛烈にトイレに行きたくなる。",
    "タクシーを拾おうとしたら、通過する車両が全て回送になる。",
    "電車で座っていると、ハゲたおじさんが寝ぼけて寄りかかってくる。",
    "特急電車に乗った瞬間に、猛烈にお腹を下す。",
    "帰宅して鍵を開けようとすると、鍵穴にピーナッツが大量に詰まっている。",
    "コンビニで弁当を買うと、必ず箸を入れ忘れられる。",
    "居酒屋で頼んだビールが絶妙にぬるい。",
    "恋人に送るはずの甘いLINEを、間違えて父へ送ってしまう。",
    "スマホの充電の減りが、いつもの10倍早くなる。",
    "職場へ着いてから、ズボンがパジャマのままであることに気がつく。",
    "宝くじが当たった夢を見て、起きたら2時間寝過ごしている。",
    "飲み会の集合場所に着いたら、場所の変更が自分だけ知らされず、いくら待っても誰も来ない。",
    "洗濯物を干した瞬間、突然の豪雨でびしょ濡れになる。",
    "お風呂で突然、シャワーのお湯が水に変わる。",
    "寝転んでスマホを触っていたら、手が滑って顔面に直撃する。",
    "深夜にとなりの部屋から、ヒップホップが朝まで大音量で流れてくる。"
];

/* ================================================================
   02 ゲーム全体で使う設定
   大文字の定数は、途中で値を変更しない設定に使う。
   ================================================================ */
const STORAGE_KEY = "iya-death-note-pages-v2";
const POSITION_KEY = "iya-death-note-position-v2";
const MAX_RECORDS = 5;
const LETTER_INTERVAL = 90;
const GLOW_DURATION = 1000;
const PAGE_FADE_DURATION = 500;
const TEAR_DURATION = 900;

// pagesは「ページの一覧」。ページの中には記録が最大5件入る。
// 例：pages[0][0] は1ページ目の1件目。
let pages = [];
let currentPage = 0;
let isBusy = false;

/* ================================================================
   03 HTMLの要素を取得する
   getElementById()の引数はHTMLのidと一致させる。
   ================================================================ */
const shell = document.getElementById("app-shell");
const stage = document.getElementById("app-stage");
const coverScene = document.getElementById("cover-scene");
const bookScene = document.getElementById("book-scene");
const nameInput = document.getElementById("name-input");
const dateInput = document.getElementById("date-input");
const reasonInput = document.getElementById("reason-input");
const entryForm = document.getElementById("entry-form");
const records = document.getElementById("records");
const tearLayer = document.getElementById("tear-layer");
const tearRecords = document.getElementById("tear-records");
const blackout = document.getElementById("blackout");
const feedback = document.getElementById("feedback");

/* ================================================================
   04 画面サイズの調整
   背景1920pxを基準にHTML全体を同じ割合で縮小する。
   画像、文字、ボタンの位置を別々に調整しなくて済む。
   ================================================================ */
function resizeStage() {
    const scale = shell.clientWidth / 1920;
    stage.style.transform = "scale(" + scale + ")";
}

/* ================================================================
   05 エラーメッセージと操作ロック
   アニメーション中に二重クリックされるのを防ぐ。
   ================================================================ */
function showFeedback(message) {
    feedback.textContent = message;
}

function clearFeedback() {
    feedback.textContent = "";
}

function setBusy(value) {
    isBusy = value;

    // jQueryのprop()はdisabledなどの状態変更に使う。
    $("#open-button").prop("disabled", value);
    $("#write-button").prop("disabled", value);
    $("#tear-button").prop("disabled", value);
    $("#previous-button").prop("disabled", value);
    $("#next-button").prop("disabled", value);
    $("#name-input").prop("disabled", value);
    $("#date-input").prop("disabled", value);
    $("#reason-input").prop("disabled", value);
}

/* ================================================================
   06 保存データを読み込む
   localStorageはページを再読み込みしても情報を残す仕組み。
   不正なデータがあったときは画面が壊れないよう確認する。
   ================================================================ */
function cleanSavedPages(source) {
    const clean = [];

    if (Array.isArray(source) === false) {
        return clean;
    }

    for (let i = 0; i < source.length; i++) {
        if (Array.isArray(source[i]) === false) {
            continue;
        }

        const entries = [];

        for (let j = 0; j < source[i].length; j++) {
            if (entries.length >= MAX_RECORDS) {
                break;
            }

            const entry = source[i][j];

            if (entry === null) {
                continue;
            }

            if (typeof entry !== "object") {
                continue;
            }

            if (typeof entry.name !== "string") {
                continue;
            }

            if (entry.name.trim() === "") {
                continue;
            }

            if (typeof entry.date !== "string") {
                continue;
            }

            if (typeof entry.reason !== "string") {
                continue;
            }

            // 古い保存データにも入力上限を適用する。
            const cleanEntry = {
                name: entry.name.slice(0, 15),
                date: entry.date,
                reason: entry.reason
            };

            entries.push(cleanEntry);
        }

        // 記録0件のページは保存しない。
        if (entries.length > 0) {
            clean.push(entries);
        }
    }

    return clean;
}

function loadPages() {
    try {
        const savedPages = localStorage.getItem(STORAGE_KEY);
        const savedPosition = localStorage.getItem(POSITION_KEY);

        if (savedPages !== null) {
            const parsed = JSON.parse(savedPages);
            pages = cleanSavedPages(parsed);
        }

        if (savedPosition !== null) {
            const position = Number(savedPosition);

            if (Number.isInteger(position) === true) {
                if (position >= 0) {
                    if (position <= pages.length) {
                        currentPage = position;
                    }
                }
            }
        }
    } catch (error) {
        pages = [];
        currentPage = 0;
    }
}

function savePages() {
    try {
        const pageText = JSON.stringify(pages);
        const positionText = String(currentPage);
        localStorage.setItem(STORAGE_KEY, pageText);
        localStorage.setItem(POSITION_KEY, positionText);
        return true;
    } catch (error) {
        showFeedback("ブラウザに保存できませんでした。");
        return false;
    }
}

function savePosition() {
    try {
        localStorage.setItem(POSITION_KEY, String(currentPage));
    } catch (error) {
        showFeedback("ページ位置を保存できませんでした。");
    }
}

/* ================================================================
   07 日付とランダム嫌因
   日付が空欄なら明日。嫌因が空欄なら30件から1つ選ぶ。
   ================================================================ */
function getTomorrow() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const year = tomorrow.getFullYear();
    const month = String(tomorrow.getMonth() + 1).padStart(2, "0");
    const day = String(tomorrow.getDate()).padStart(2, "0");
    return year + "-" + month + "-" + day;
}

function formatDate(value) {
    const parts = value.split("-");

    if (parts.length === 3) {
        return Number(parts[1]) + "/" + Number(parts[2]);
    } else {
        return value;
    }
}

function selectRandomReason() {
    const random = Math.random();
    const index = Math.floor(random * RANDOM_REASONS.length);
    return RANDOM_REASONS[index];
}

/* ================================================================
   08 右ページの文字表示
   画面の5か所にはCSSの:nth-child()で位置を与えている。
   記録名、日付、嫌因の3要素を1件のrecordにまとめる。
   ================================================================ */
function getPageEntries(pageNumber) {
    if (pageNumber >= 0) {
        if (pageNumber < pages.length) {
            return pages[pageNumber];
        }
    }

    return [];
}

function makeRecord(entry, hideText) {
    const record = document.createElement("article");
    const heading = document.createElement("div");
    const name = document.createElement("span");
    const date = document.createElement("span");
    const reason = document.createElement("div");

    record.className = "record";
    heading.className = "record-heading";
    name.className = "record-name";
    date.className = "record-date";
    reason.className = "record-reason";

    if (hideText === false) {
        name.textContent = entry.name;
        date.textContent = formatDate(entry.date);
        reason.textContent = entry.reason;
    }

    heading.appendChild(name);
    heading.appendChild(date);
    record.appendChild(heading);
    record.appendChild(reason);
    return record;
}

function displayRecords(target, pageNumber, hideLast) {
    // 以前のページの文字を残さないため、先に消す。
    target.innerHTML = "";
    const entries = getPageEntries(pageNumber);

    for (let i = 0; i < entries.length; i++) {
        let hideText = false;

        if (hideLast === true) {
            if (i === entries.length - 1) {
                hideText = true;
            }
        }

        const record = makeRecord(entries[i], hideText);
        target.appendChild(record);
    }
}

function displayPage(pageNumber, fade) {
    currentPage = pageNumber;
    displayRecords(records, currentPage, false);
    savePosition();

    // 一度アニメーションクラスを外すと、続けて押しても再実行できる。
    $("#records").removeClass("page-fade");

    if (fade === true) {
        // 要素の描画を一度確定してからclassを付け直す。
        records.offsetWidth;
        $("#records").addClass("page-fade");
    }
}

/* ================================================================
   09 ノートを開く（0.5秒で黒く→0.5秒で戻る）
   setTimeout()で時間を区切って処理する。
   ================================================================ */
function openNotebook() {
    if (isBusy === true) {
        return;
    }

    setBusy(true);
    $("#blackout").addClass("active");

    // 0.5秒後：画面が黒くなった状態で見開きへ切り替える。
    setTimeout(function () {
        $("#cover-scene").addClass("is-hidden");
        $("#book-scene").removeClass("is-hidden");
        displayPage(currentPage, false);
    }, 500);

    // 1秒後：黒い幕を消して次の操作を許可する。
    setTimeout(function () {
        $("#blackout").removeClass("active");
        setBusy(false);
    }, 1000);
}

/* ================================================================
   10 文字を1文字ずつ書く
   setInterval()を使う。1文字につき90ms（0.09秒）。
   1つ書き終えたらcallback()で次の項目へ進む。
   ================================================================ */
function writeLetters(element, value, callback) {
    const letters = Array.from(value);
    let index = 0;

    if (letters.length === 0) {
        callback();
        return;
    }

    const timerId = setInterval(function () {
        element.textContent = element.textContent + letters[index];
        index = index + 1;

        if (index >= letters.length) {
            clearInterval(timerId);
            callback();
        }
    }, LETTER_INTERVAL);
}

/* ================================================================
   11 記す：入力確認→保存→名前→日付→嫌因→発光→入力消去
   途中で失敗したら入力欄を消さない。
   ================================================================ */
function writeEntry(event) {
    event.preventDefault();

    if (isBusy === true) {
        return;
    }

    clearFeedback();
    const name = nameInput.value.trim();
    let date = dateInput.value;
    let reason = reasonInput.value.trim();

    if (name === "") {
        return;
    }

    if (date === "") {
        date = getTomorrow();
    }

    if (reason === "") {
        reason = selectRandomReason();
    }

    const currentEntries = getPageEntries(currentPage);

    if (currentEntries.length >= MAX_RECORDS) {
        return;
    }

    setBusy(true);
    const entry = {
        name: name,
        date: date,
        reason: reason
    };
    let newPage = false;

    if (currentPage === pages.length) {
        pages.push([]);
        newPage = true;
    }

    pages[currentPage].push(entry);
    const saveSucceeded = savePages();

    if (saveSucceeded === false) {
        pages[currentPage].pop();

        if (newPage === true) {
            pages.pop();
        }

        setBusy(false);
        return;
    }

    // 新しい1件だけ空欄で表示し、後から文字を追加していく。
    displayRecords(records, currentPage, true);
    const newRecord = records.lastElementChild;
    const nameTarget = newRecord.querySelector(".record-name");
    const dateTarget = newRecord.querySelector(".record-date");
    const reasonTarget = newRecord.querySelector(".record-reason");

    // 入れ子のcallbackは「名前→日付→嫌因」の順番を守るため。
    writeLetters(nameTarget, name, function () {
        writeLetters(dateTarget, formatDate(date), function () {
            writeLetters(reasonTarget, reason, function () {
                $(newRecord).addClass("glow");

                // 発光アニメーション1秒（0.5秒で白→0.5秒で黒）。
                setTimeout(function () {
                    $(newRecord).removeClass("glow");
                    entryForm.reset();
                    setBusy(false);
                }, GLOW_DURATION);
            });
        });
    });
}

/* ================================================================
   12 左右へめくる：移動先の文字だけ0.5秒フェードイン
   空白ページでは、右に押しても無限にページを増やさない。
   ================================================================ */
function movePage(direction) {
    if (isBusy === true) {
        return;
    }

    let targetPage = currentPage + direction;

    if (targetPage < 0) {
        targetPage = 0;
    }

    if (targetPage > pages.length) {
        targetPage = pages.length;
    }

    if (targetPage === currentPage) {
        return;
    }

    clearFeedback();
    setBusy(true);

    // 今のページの文字を0.5秒かけて消す
    $("#records").removeClass("page-fade");
    $("#records").addClass("page-fade-out");

    setTimeout(function () {

        // 文字が消えてから次のページに切り替える
        $("#records").removeClass("page-fade-out");
        displayPage(targetPage, true);

        // 次のページの文字を0.5秒かけて表示する
        setTimeout(function () {
            $("#records").removeClass("page-fade");
            setBusy(false);
        }, PAGE_FADE_DURATION);

    }, PAGE_FADE_DURATION);
}

function moveLeft() {
    movePage(-1);
}

function moveRight() {
    movePage(1);
}

/* ================================================================
   13 紙のギザギザを作る
   破棄のときだけ左端を3px左右に振る。
   通常の見開き背景には、この線を表示しない。
   ================================================================ */
function makeTearShape() {
    const points = [];
    points.push("100% 0");
    points.push("100% 100%");
    points.push("0 100%");

    let y = 1088;
    let step = 0;

    while (y >= 0) {
        let x = 0;

        if (step % 2 === 0) {
            x = 3;
        } else {
            x = 0;
        }

        points.push(x + "px " + y + "px");
        y = y - 12;
        step = step + 1;
    }

    return "polygon(" + points.join(",") + ")";
}

/* ================================================================
   14 破り捨てる：page-1.pngと記録を一緒に落下させる
   全ページを削除する。左ページの入力内容は消さない。
   ================================================================ */
function tearAll() {
    if (isBusy === true) {
        return;
    }

    clearFeedback();
    setBusy(true);

    displayRecords(tearRecords, currentPage, false);
    tearLayer.style.clipPath = makeTearShape();
    $("#tear-layer").addClass("visible");
    records.style.visibility = "hidden";

    // 一度描画させると、CSSの破棄アニメーションが確実に始まる。
    tearLayer.offsetWidth;
    $("#tear-layer").addClass("tearing");

    setTimeout(function () {
        pages = [];
        currentPage = 0;

        try {
            localStorage.removeItem(STORAGE_KEY);
            localStorage.removeItem(POSITION_KEY);
        } catch (error) {
            showFeedback("保存データの削除に失敗しました。");
        }

        $("#tear-layer").removeClass("tearing");
        $("#tear-layer").removeClass("visible");
        tearLayer.style.clipPath = "";
        tearRecords.innerHTML = "";
        records.style.visibility = "";
        displayPage(0, false);
        setBusy(false);
    }, TEAR_DURATION);
}

/* ================================================================
   15 初期化：読み込み・表示・ボタンにクリック処理を登録
   .on("click", 関数名) がjQueryの基本形。
   ================================================================ */
function initialize() {
    resizeStage();
    loadPages();
    displayPage(currentPage, false);

    $(window).on("resize", resizeStage);
    $("#open-button").on("click", openNotebook);
    $("#entry-form").on("submit", writeEntry);
    $("#tear-button").on("click", tearAll);
    $("#previous-button").on("click", moveLeft);
    $("#next-button").on("click", moveRight);
}

// HTMLを読み込んでから、最初に一度だけ初期化する。
// index.htmlではjQuery → script.jsの順に読み込むこと。
initialize();
