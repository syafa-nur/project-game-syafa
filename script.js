/* =====================================================
   PASSPORT — A Card-Matching World Tour
   -----------------------------------------------------
   Game logic: landmarks/questions data, stages, cards,
   timer, sudden question, stage clear, game over, victory.
===================================================== */

const $ = (id) => document.getElementById(id);

/* ---------- DATA ---------- */
const LANDMARKS = [
    { country: "Thailand", name: "Wat Arun", img: "https://i.pinimg.com/736x/11/cf/44/11cf44525f25edc6a58851871b0c952a.jpg" },
    { country: "Jepang", name: "Gunung Fuji", img: "https://i.pinimg.com/1200x/c2/55/62/c255621f98dd5889e1f4768be5f9732e.jpg" },
    { country: "Italia", name: "Colosseum", img: "https://i.pinimg.com/1200x/a0/cd/b2/a0cdb2aa71bb75da45f2abc809636e7a.jpg" },
    { country: "Prancis", name: "Menara Eiffel", img: "https://i.pinimg.com/1200x/9b/f7/b9/9bf7b97b215a46e249c1535f8d880116.jpg" },
    { country: "Australia", name: "Gedung Opera Sydney", img: "https://i.pinimg.com/1200x/2f/01/fa/2f01fac0acf41abcc2e96436e7da73f1.jpg" },
    { country: "Mesir", name: "Piramida Giza", img: "https://i.pinimg.com/1200x/cc/b8/50/ccb850893b1243215a5f8700ec392e8d.jpg" },
    { country: "India", name: "Taj Mahal", img: "https://i.pinimg.com/1200x/54/3c/d1/543cd14cf48629aa4ec9568d25e58520.jpg" },
    { country: "Brasil", name: "Patung Kristus Penebus", img: "https://i.pinimg.com/1200x/6d/fe/d7/6dfed79ecf010ac4d7a144d2eecf3523.jpg" },
    { country: "Tiongkok", name: "Tembok Besar China", img: "https://i.pinimg.com/1200x/87/52/ab/8752abe03c533c7701985a09cf5971c4.jpg" },
    { country: "Inggris", name: "Big Ben", img: "https://i.pinimg.com/736x/9e/e5/13/9ee51345cf70d22015674655ccf9a4de.jpg" },
];

// Muncul tepat saat timer = 5 detik
const suddenQuestions = [
    { q: "Negara mana yang menjadi lokasi Piramida Agung Giza?", a: "Mesir", o: ["Mesir", "Turki", "Maroko", "India"] },
    { q: "Negara mana yang menjadi lokasi Colosseum?", a: "Italia", o: ["Spanyol", "Italia", "Yunani", "Prancis"] },
    { q: "Negara mana yang terkenal dengan Gunung Fuji?", a: "Jepang", o: ["Tiongkok", "Jepang", "Korea Selatan", "Thailand"] },
    { q: "Wat Arun adalah landmark terkenal di negara mana?", a: "Thailand", o: ["Vietnam", "Thailand", "India", "Nepal"] },
    { q: "Menara Eiffel berada di negara mana?", a: "Prancis", o: ["Prancis", "Belgia", "Italia", "Swiss"] },
    { q: "Negara mana yang terkenal dengan Taj Mahal?", a: "India", o: ["India", "Nepal", "Pakistan", "Bangladesh"] },
];

// Pasangan kartu untuk Stage 2 (1 pair) & Stage 3 (6 pairs)
const qaPairs = [
    { q: "Apa ibu kota Jepang?", a: "Tokyo" },
    { q: "Negara mana yang menjadi lokasi Colosseum?", a: "Italia" },
    { q: "Apa ibu kota Prancis?", a: "Paris" },
    { q: "Negara mana yang terkenal dengan kanguru dan koala?", a: "Australia" },
    { q: "Apa ibu kota Thailand?", a: "Bangkok" },
    { q: "Negara mana yang menjadi lokasi Taj Mahal?", a: "India" },
    { q: "Apa ibu kota Mesir?", a: "Kairo" },
    { q: "Negara mana yang menjadi lokasi Tembok Besar?", a: "Tiongkok" },
];

// Urutan otomatis: Stage 1 -> Stage 2 -> Stage 3 -> Victory
const stages = [
    { name: "Keliling Dunia", difficulty: "Easy", number: "1", time: 30, pairs: 4, type: "image" },
    { name: "Keliling Dunia", difficulty: "Medium", number: "2", time: 50, pairs: 6, type: "medium" },
    { name: "Keliling Dunia", difficulty: "Hard", number: "3", time: 50, pairs: 6, type: "qa" },
];

/* ---------- STATE ---------- */
let stageIndex = 0;
let score = 0;
let timeLeft = 30;
let timer = null;
let flipped = [];
let locked = false;
let matched = 0;
let suddenShown = false;
let musicOn = true;


/* =====================================================
   HIGH SCORE (localStorage)
===================================================== */

const HIGH_SCORE_KEY = "passportHighScore";

function getHighScore() {
    return parseInt(localStorage.getItem(HIGH_SCORE_KEY) || "0", 10);
}

function refreshHighScoreBadge() {
    const el = $("highScoreValue");
    if (el) {
        el.textContent = getHighScore();
    }
}

// Simpan skor baru kalau melampaui rekor lama.
// Return true kalau rekor baru pecah (dipakai buat tampilkan label "Rekor Baru!")
function trySaveHighScore(finalScore) {
    const current = getHighScore();

    if (finalScore > current) {
        localStorage.setItem(HIGH_SCORE_KEY, finalScore);
        return true;
    }

    return false;
}


/* =====================================================
   TUTORIAL ("Cara Bermain") — muncul otomatis
   sekali di percobaan pertama, sebelum Stage 1.
   Bisa dilihat lagi kalau localStorage dibersihkan.
===================================================== */

const TUTORIAL_SEEN_KEY = "passportTutorialSeen";

const TUTORIAL_STEPS = [
    {
        title: "Selamat Datang, Penjelajah! 🌍",
        text: "Passport adalah game mencocokkan kartu bertema keliling dunia. Ketuk dua kartu setiap giliran untuk mencari pasangannya."
    },
    {
        title: "Tiga Tahap Perjalanan ✈️",
        text: "Ada 3 tahap: gambar landmark, campuran gambar & tanya-jawab, lalu tanya-jawab penuh. Selesaikan semua pasangan sebelum waktu habis."
    },
    {
        title: "Pertanyaan Negara Mendadak ❓",
        text: "Saat waktu tersisa 5 detik, sebuah pertanyaan mendadak akan muncul. Jawab benar untuk mendapat bonus waktu dan skor!"
    },
    {
        title: "Kumpulkan Skor Tertinggi 🏆",
        text: "Sisa waktu di akhir tahap jadi bonus skor. Coba kalahkan rekormu sendiri di setiap percobaan!"
    },
];

let tutorialIndex = 0;
let pendingStartAfterTutorial = false;

function renderTutorialStep() {
    const step = TUTORIAL_STEPS[tutorialIndex];

    $("tutTitle").textContent = step.title;
    $("tutText").textContent = step.text;

    $("tutDots").innerHTML = TUTORIAL_STEPS
        .map((_, i) => `<span class="dot${i === tutorialIndex ? " active" : ""}"></span>`)
        .join("");

    $("tutNext").textContent =
        tutorialIndex === TUTORIAL_STEPS.length - 1
            ? "Mulai Main"
            : "Lanjut";
}

function openTutorial() {
    tutorialIndex = 0;
    renderTutorialStep();
    $("tutorial").classList.remove("hidden");
}

function closeTutorialAndProceed() {
    localStorage.setItem(TUTORIAL_SEEN_KEY, "1");
    $("tutorial").classList.add("hidden");

    if (pendingStartAfterTutorial) {
        pendingStartAfterTutorial = false;
        beginGame();
    }
}


/* =====================================================
   AUDIO
   -----------------------------------------------------
   Background music tetap menggunakan file music.mp3
   (letakkan di folder yang sama dengan index.html).

   Sound effect (flip/match/wrong/click/win/gameover)
   TIDAK butuh file mp3 sama sekali — dibuat langsung
   lewat Web Audio API (oscillator), jadi otomatis
   selalu ada walau kamu tidak punya file suaranya.
===================================================== */

const bgMusic = new Audio("./music.mp3");

bgMusic.loop = true;
bgMusic.preload = "auto";
bgMusic.volume = 0.35;

// Preset nada untuk tiap sound effect.
// Tiap "note" = { freq (Hz), duration (detik), wave (bentuk gelombang), delay (jeda mulai, detik) }
const flipSound = { notes: [{ freq: 520, duration: 0.07, wave: "triangle" }] };

const matchSound = { notes: [
    { freq: 660, duration: 0.09, wave: "sine" },
    { freq: 880, duration: 0.12, wave: "sine", delay: 0.08 },
] };

const wrongSound = { notes: [{ freq: 200, endFreq: 100, duration: 0.18, wave: "sawtooth" }] };

const clickSound = { notes: [{ freq: 780, duration: 0.04, wave: "square" }] };

const winSound = { notes: [
    { freq: 523.25, duration: 0.14, wave: "sine" },
    { freq: 659.25, duration: 0.14, wave: "sine", delay: 0.1 },
    { freq: 783.99, duration: 0.14, wave: "sine", delay: 0.2 },
    { freq: 1046.5, duration: 0.3, wave: "sine", delay: 0.32 },
] };

const gameOverSound = { notes: [
    { freq: 392, duration: 0.16, wave: "sawtooth" },
    { freq: 329.63, duration: 0.16, wave: "sawtooth", delay: 0.13 },
    { freq: 261.63, duration: 0.32, wave: "sawtooth", delay: 0.26 },
] };


/* ---------- WEB AUDIO CONTEXT (untuk sound effect) ---------- */

let audioCtx = null;

function getAudioContext() {
    if (!audioCtx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        audioCtx = new AudioCtx();
    }

    if (audioCtx.state === "suspended") {
        audioCtx.resume();
    }

    return audioCtx;
}


/* ---------- PLAY SOUND EFFECT ---------- */
// sound = salah satu preset di atas ({ notes: [...] })

function playSound(sound) {
    if (!musicOn) return;

    try {
        const ctx = getAudioContext();

        sound.notes.forEach((note) => {
            const startTime = ctx.currentTime + (note.delay || 0);

            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = note.wave || "sine";
            osc.frequency.setValueAtTime(note.freq, startTime);

            // Kalau ada endFreq, nadanya "meluncur" dari freq ke endFreq
            // (dipakai buzzer "wrong" biar kedengeran turun, bukan datar)
            if (note.endFreq) {
                osc.frequency.exponentialRampToValueAtTime(note.endFreq, startTime + note.duration);
            }

            gain.gain.setValueAtTime(0.0001, startTime);
            gain.gain.exponentialRampToValueAtTime(0.2, startTime + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.0001, startTime + note.duration);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(startTime);
            osc.stop(startTime + note.duration + 0.02);
        });
    } catch (error) {
        console.log("Sound effect gagal diputar:", error);
    }
}


/* ---------- START MUSIC ---------- */

function startMusic() {
    if (!musicOn) return;

    const promise = bgMusic.play();

    if (promise !== undefined) {
        promise
            .then(() => {
                console.log("music.mp3 berhasil diputar.");
            })
            .catch((error) => {
                console.error("music.mp3 gagal diputar:", error);
            });
    }
}


/* ---------- STOP MUSIC ---------- */

function stopMusic() {
    bgMusic.pause();
}


/* ---------- AUDIO UNLOCK ---------- */

function unlockAudio() {
    hideSoundHint();

    if (!musicOn) return;

    if (bgMusic.paused) {
        bgMusic.play().catch(() => {});
    }
}


/* ---------- SOUND HINT ("Tap anywhere to start") ---------- */

function hideSoundHint() {
    const hint = $("soundHint");
    if (!hint) return;

    hint.classList.add("fade-out");

    setTimeout(() => hint.remove(), 600);
}


/* ---------- USER INTERACTION ---------- */

document.addEventListener(
    "pointerdown",
    unlockAudio,
    { once: true }
);


/* ---------- AUDIO ERROR CHECK ---------- */

bgMusic.addEventListener("error", () => {
    console.error(
        "Gagal membaca file ./music.mp3:",
        bgMusic.error
    );
});


/* ---------- AUDIO READY CHECK ---------- */

bgMusic.addEventListener("canplaythrough", () => {
    console.log("music.mp3 siap diputar.");
});


/* ---------- SCREEN HELPERS ---------- */

function show(screenId) {
    document.querySelectorAll(".screen").forEach((s) => s.classList.add("hidden"));
    $(screenId).classList.remove("hidden");

    if (screenId === "menuScreen") {
        refreshHighScoreBadge();
    }
}

function hideOverlay() {
    document.querySelectorAll(".overlay").forEach((o) => o.classList.add("hidden"));
}

function shuffle(array) {
    return [...array].sort(() => Math.random() - 0.5);
}


/* ---------- MENU ---------- */

function beginGame() {
    show("gameScreen");
    score = 0;
    startStage(0);
}

$("playBtn").onclick = () => {
    playSound(clickSound);

    // Mulai background music langsung dari interaksi tombol Play
    startMusic();

    // Tampilkan tutorial hanya di percobaan pertama
    if (!localStorage.getItem(TUTORIAL_SEEN_KEY)) {
        pendingStartAfterTutorial = true;
        openTutorial();
    } else {
        beginGame();
    }
};

$("tutNext").onclick = () => {
    playSound(clickSound);

    if (tutorialIndex < TUTORIAL_STEPS.length - 1) {
        tutorialIndex++;
        renderTutorialStep();
    } else {
        closeTutorialAndProceed();
    }
};

$("tutorialClose").onclick = () => {
    playSound(clickSound);
    closeTutorialAndProceed();
};

$("aboutBtn").onclick = () => {
    playSound(clickSound);
    show("aboutScreen");
};

// Semua tombol dengan data-back="namaScreen" kembali ke screen itu
document.querySelectorAll("[data-back]").forEach((btn) => {
    btn.onclick = () => {
        playSound(clickSound);

        hideOverlay();
        stopTimer();
        show(btn.dataset.back);
    };
});


/* ---------- START STAGE ---------- */

function startStage(index) {
    stageIndex = index;
    matched = 0;
    flipped = [];
    locked = false;
    suddenShown = false;

    const stage = stages[stageIndex];
    timeLeft = stage.time;

    $("stageName").textContent = stage.difficulty;
    $("timeValue").textContent = timeLeft;
    $("scoreValue").textContent = score;

    $("timerBar").style.width = "100%";
    $("timerBar").classList.remove("danger");

    updateStageProgress();

    buildBoard(stage);
    startTimer();
}


/* ---------- STAGE PROGRESS BAR (pasangan cocok) ---------- */

function updateStageProgress() {
    const stage = stages[stageIndex];
    const el = $("stageProgressFill");
    if (!el) return;

    const pct = stage.pairs
        ? Math.min(100, (matched / stage.pairs) * 100)
        : 0;

    el.style.width = pct + "%";
}


/* ---------- BUILD BOARD ---------- */

function buildBoard(stage) {
    const board = $("board");
    board.innerHTML = "";
    board.className = "board " + (stage.type === "image" ? "easy" : "normal");

    let items = [];

    if (stage.type === "image") {
        // Stage 1: 4 pasangan gambar landmark
        shuffle(LANDMARKS).slice(0, 4).forEach((landmark, index) => {
            items.push({ id: index, kind: "image", data: landmark });
        });

        $("stageTitle").textContent = "Perjalanan Dimulai";
        $("stageHint").textContent = "Cocokkan gambar landmark.";

    } else if (stage.type === "medium") {
        // Stage 2: 5 pasangan gambar + 1 pasangan tanya-jawab
        shuffle(LANDMARKS).slice(0, 5).forEach((landmark, index) => {
            items.push({ id: index, kind: "image", data: landmark });
        });

        const question = qaPairs[Math.floor(Math.random() * qaPairs.length)];
        items.push({ id: "qa-medium", kind: "qa", data: question });

        $("stageTitle").textContent = "Lanjutkan Perjalanan";
        $("stageHint").textContent = "Cocokkan landmark — plus satu pasangan tanya-jawab.";

    } else {
        // Stage 3: 6 pasangan tanya-jawab
        shuffle(qaPairs).slice(0, 6).forEach((question, index) => {
            items.push({ id: index, kind: "qa", data: question });
        });

        $("stageTitle").textContent = "Tujuan Akhir";
        $("stageHint").textContent = "Cocokkan setiap pertanyaan dengan jawaban yang benar.";
    }

    // Setiap item jadi 2 kartu dengan id sama (dianggap pasangan).
    // Untuk QA: kartu A = pertanyaan, kartu B = jawaban.
    let cards = [];

    items.forEach((item) => {
        if (item.kind === "image") {
            cards.push({
                id: item.id,
                kind: "image",
                data: item.data,
                side: "image"
            });

            cards.push({
                id: item.id,
                kind: "image",
                data: item.data,
                side: "image"
            });

        } else {
            cards.push({
                id: item.id,
                kind: "qa",
                data: item.data,
                side: "question"
            });

            cards.push({
                id: item.id,
                kind: "qa",
                data: item.data,
                side: "answer"
            });
        }
    });

    cards = shuffle(cards);

    cards.forEach((card) => {
        const element = document.createElement("div");

        element.className = "card";
        element.dataset.id = card.id;

        let frontHTML = "";

        if (card.kind === "image") {
            frontHTML = `
                <div class="face front">
                    <img 
                        src="${card.data.img}" 
                        alt="${card.data.name}" 
                        loading="lazy" 
                        onerror="imageFallback(this)"
                    >
                    <div class="caption">
                        ${card.data.country} · ${card.data.name}
                    </div>
                </div>`;

        } else if (card.side === "question") {

            frontHTML = `
                <div class="face front qa">
                    ❓ ${card.data.q}
                </div>`;

        } else {

            frontHTML = `
                <div class="face front qa">
                    🌍 ${card.data.a}
                </div>`;
        }

        element.innerHTML = `
            <div class="card-inner">
                <div class="face back">✦</div>
                ${frontHTML}
            </div>`;

        element.onclick = () => flip(element, card);

        board.appendChild(element);
    });
}


/* ---------- IMAGE FALLBACK ---------- */

// Jika gambar landmark gagal dimuat, tampilkan pengganti berupa emoji + nama
function imageFallback(image) {
    image.style.display = "none";

    const front = image.parentElement;

    front.style.background =
        "linear-gradient(145deg,#bde8ef,#fff8e8)";

    const caption = front.querySelector(".caption");

    if (caption) {
        caption.style.display = "none";
    }

    const fallback = document.createElement("div");

    Object.assign(fallback.style, {
        position: "absolute",
        inset: "0",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        padding: "20px",
        textAlign: "center",
        fontWeight: "900",
        color: "#073653",
    });

    fallback.innerHTML = `
        <span style="font-size:48px">🌍</span>
        <span>${image.alt}</span>
    `;

    front.appendChild(fallback);
}


/* ---------- FLIP CARD ---------- */

function flip(element, card) {
    if (locked) return;

    if (
        element.classList.contains("flipped") ||
        element.classList.contains("matched")
    ) {
        return;
    }

    // SOUND: kartu dibuka
    playSound(flipSound);

    element.classList.add("flipped");

    flipped.push({
        element,
        card
    });

    if (flipped.length === 2) {
        locked = true;

        const [first, second] = flipped;

        setTimeout(() => {
            const same =
                first.card.id === second.card.id;

            if (same) {
                first.element.classList.add("matched");
                second.element.classList.add("matched");

                // SOUND: pasangan benar
                playSound(matchSound);

                matched++;
                score += 20;

                $("scoreValue").textContent = score;
                updateStageProgress();

                if (
                    matched ===
                    stages[stageIndex].pairs
                ) {
                    finishStage(true);
                }

            } else {
                // SOUND: pasangan salah
                playSound(wrongSound);

                first.element.classList.remove("flipped");
                second.element.classList.remove("flipped");
            }

            flipped = [];
            locked = false;

        }, 500);
    }
}


/* ---------- TIMER ---------- */

function startTimer() {
    stopTimer();

    timer = setInterval(() => {

        if (timeLeft <= 0) {
            finishStage(false);
            return;
        }

        timeLeft--;
        renderTime();

        // Sudden question muncul tepat di detik ke-5,
        // kalau stage belum selesai
        if (
            timeLeft === 5 &&
            !suddenShown &&
            matched < stages[stageIndex].pairs
        ) {
            showSudden();
        }

        if (timeLeft <= 0 && !suddenShown) {
            finishStage(false);
        }

    }, 1000);
}


function stopTimer() {
    if (timer) {
        clearInterval(timer);
        timer = null;
    }
}


function renderTime() {
    $("timeValue").textContent = timeLeft;

    const percentage =
        (timeLeft / stages[stageIndex].time) * 100;

    $("timerBar").style.width =
        percentage + "%";

    $("timerBar").classList.toggle(
        "danger",
        timeLeft <= 5
    );
}


/* ---------- SUDDEN QUESTION ---------- */

function showSudden() {
    suddenShown = true;
    locked = true;

    // waktu berhenti tepat di angka 5
    stopTimer();

    const question =
        suddenQuestions[
            Math.floor(
                Math.random() *
                suddenQuestions.length
            )
        ];

    $("suddenQuestion").textContent =
        question.q;

    $("suddenOptions").innerHTML =
        question.o
            .map(
                (option) =>
                    `<button class="opt" type="button">${option}</button>`
            )
            .join("");

    $("suddenOverlay").classList.remove("hidden");

    document
        .querySelectorAll("#suddenOptions .opt")
        .forEach((button) => {

            button.onclick = () => {

                // SOUND: klik jawaban
                playSound(clickSound);

                const correct =
                    button.textContent.trim() ===
                    question.a;

                document
                    .querySelectorAll("#suddenOptions .opt")
                    .forEach(
                        (opt) =>
                            (opt.disabled = true)
                    );

                button.classList.add(
                    correct
                        ? "correct"
                        : "wrong"
                );

                if (correct) {

                    // Jawaban benar:
                    // +10 detik, +10 score
                    timeLeft += 10;
                    score += 10;

                    $("scoreValue").textContent =
                        score;

                    renderTime();

                    // SOUND: jawaban benar
                    playSound(matchSound);

                } else {

                    // SOUND: jawaban salah
                    playSound(wrongSound);
                }

                setTimeout(() => {

                    $("suddenOverlay")
                        .classList.add("hidden");

                    showAnswerFeedback(correct);

                }, 500);
            };
        });
}


/* ---------- FEEDBACK JAWABAN (Correct! / Wrong!) ---------- */

function showAnswerFeedback(correct) {
    const card = $("feedbackCard");

    card.className =
        "feedback-card " + (correct ? "correct" : "wrong");

    $("feedbackIcon").textContent = correct ? "✓" : "✕";
    $("feedbackTitle").textContent = correct ? "Benar!" : "Salah!";
    $("feedbackSubtext").textContent =
        correct ? "+10 detik" : "Tidak ada tambahan waktu";

    $("answerFeedback").classList.remove("hidden");
}

$("feedbackContinue").onclick = () => {
    playSound(clickSound);

    $("answerFeedback").classList.add("hidden");

    locked = false;

    // lanjut dari 5 detik, atau 15 kalau jawaban benar
    startTimer();
};


/* ---------- FINISH STAGE ---------- */

// Dipanggil saat stage berhasil diselesaikan ATAU waktu habis
function finishStage(success) {

    stopTimer();
    hideOverlay();

    if (!success) {

        // SOUND: game over
        playSound(gameOverSound);

        $("overScore").textContent =
            score;

        $("overNewRecord").classList.toggle(
            "hidden",
            !trySaveHighScore(score)
        );

        $("gameOver")
            .classList.remove("hidden");

        return;
    }

    // Bonus stage = (sisa waktu x 2) + 100
    const bonus =
        Math.max(0, timeLeft * 2) + 100;

    score += bonus;

    $("stageBonus").textContent =
        bonus;

    $("scoreValue").textContent =
        score;

    const isFinalStage =
        stageIndex === stages.length - 1;

    // SOUND: stage selesai
    playSound(matchSound);

    $("stageClear")
        .classList.remove("hidden");

    $("continueBtn").textContent =
        isFinalStage
            ? "Lihat Skor Akhir"
            : "Lanjut";

    $("continueBtn").onclick = () => {

        playSound(clickSound);

        $("stageClear")
            .classList.add("hidden");

        if (isFinalStage) {

            // SOUND: menang
            playSound(winSound);

            $("winScore").textContent =
                score;

            $("winNewRecord").classList.toggle(
                "hidden",
                !trySaveHighScore(score)
            );

            $("victory")
                .classList.remove("hidden");

        } else {

            startStage(
                stageIndex + 1
            );
        }
    };
}


/* ---------- RETRY / PLAY AGAIN ---------- */

$("retryBtn").onclick = () => {

    playSound(clickSound);

    hideOverlay();

    score = 0;

    startStage(0);
};


$("victoryPlayAgain").onclick = () => {

    playSound(clickSound);

    hideOverlay();

    score = 0;

    startStage(0);
};


/* ---------- SOUND TOGGLE ---------- */

// Isi badge skor tertinggi begitu game dimuat pertama kali
refreshHighScoreBadge();


document.querySelectorAll(".sound-toggle").forEach((btn) => {
    btn.onclick = () => {
        musicOn = !musicOn;

        document.querySelectorAll(".sound-toggle").forEach((b) => {
            b.textContent = musicOn ? "🔊" : "🔇";
        });

        if (musicOn) {
            startMusic();
        } else {
            stopMusic();
        }
    };
});