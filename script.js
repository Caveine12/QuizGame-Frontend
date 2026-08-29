const API_URL = "https://api.gamequiz.my.id";

let currentUser = null;
let questions = [];
let currentQuestion = 0;
let currentScore = 0;

const pages = {
    login: document.getElementById("loginPage"),
    register: document.getElementById("registerPage"),
    home: document.getElementById("homePage"),
    quiz: document.getElementById("quizPage"),
    result: document.getElementById("resultPage"),
    leaderboard: document.getElementById("leaderboardPage")
};


function showPage(name) {

    Object.values(pages).forEach(page => {
        page.classList.add("hidden");
    });

    pages[name].classList.remove("hidden");
}

async function api(endpoint, options = {}) {

    const response = await fetch(
        API_URL + endpoint,
        {
            ...options,

            headers: {
                "Content-Type": "application/json",
                ...(options.headers || {})
            }
        }
    );

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            data.message || "Terjadi kesalahan."
        );
    }

    return data;
}

async function register() {

    const username =
        document.getElementById(
            "registerUsername"
        ).value.trim();

    const password =
        document.getElementById(
            "registerPassword"
        ).value;

    const message =
        document.getElementById(
            "registerMessage"
        );


    if (!username || !password) {

        message.textContent =
            "Username dan password wajib diisi.";

        return;
    }


    try {

        const data = await api(
            "/api/register",
            {
                method: "POST",

                body: JSON.stringify({
                    username,
                    password
                })
            }
        );


        message.textContent =
            "✅ " + data.message;


        document.getElementById(
            "registerUsername"
        ).value = "";

        document.getElementById(
            "registerPassword"
        ).value = "";


        setTimeout(() => {
            showPage("login");
        }, 700);


    } catch (error) {

        message.textContent =
            "❌ " + error.message;

    }
}

async function login() {

    const username =
        document.getElementById(
            "loginUsername"
        ).value.trim();

    const password =
        document.getElementById(
            "loginPassword"
        ).value;

    const message =
        document.getElementById(
            "loginMessage"
        );


    if (!username || !password) {

        message.textContent =
            "Username dan password wajib diisi.";

        return;
    }


    try {

        const data = await api(
            "/api/login",
            {
                method: "POST",

                body: JSON.stringify({
                    username,
                    password
                })
            }
        );


        currentUser = data.user;

        currentScore =
            currentUser.score;


        localStorage.setItem(
            "quizUser",
            JSON.stringify(currentUser)
        );


        updateHome();

        showPage("home");


    } catch (error) {

        message.textContent =
            "❌ " + error.message;

    }
}

async function refreshProfile() {

    if (!currentUser)
        return;


    try {

        const data = await api(
            "/api/profile/" +
            currentUser.id
        );


        currentUser = data.user;

        currentScore =
            currentUser.score;


        localStorage.setItem(
            "quizUser",
            JSON.stringify(currentUser)
        );


        updateHome();


    } catch (error) {

        console.error(error);

    }
}

function updateHome() {

    if (!currentUser)
        return;


    document.getElementById(
        "username"
    ).textContent =
        currentUser.username;


    document.getElementById(
        "score"
    ).textContent =
        currentUser.score;


    document.getElementById(
        "level"
    ).textContent =
        currentUser.level;
}

async function startGame() {

    if (!currentUser) {

        showPage("login");

        return;
    }


    try {

        await refreshProfile();


        currentQuestion = 0;

        currentScore =
            currentUser.score;


        await loadQuestions();


        showPage("quiz");

        showQuestion();


    } catch (error) {

        alert(
            "Gagal memulai kuis:\n" +
            error.message
        );

    }
}

async function loadQuestions() {

    const data = await api(
        "/api/questions?user_id=" +
        currentUser.id
    );


    questions =
        data.questions;


    if (
        !questions ||
        questions.length === 0
    ) {

        throw new Error(
            "Tidak ada soal untuk level ini."
        );
    }
}

function showQuestion() {

    if (
        currentQuestion >=
        questions.length
    ) {

        completeLevel();

        return;
    }


    const question =
        questions[currentQuestion];


    document.getElementById(
        "quizLevel"
    ).textContent =
        "🔥 LEVEL " +
        currentUser.level;


    document.getElementById(
        "quizScore"
    ).textContent =
        "⭐ " +
        currentScore;


    document.getElementById(
        "questionNumber"
    ).textContent =
        "Soal " +
        (currentQuestion + 1) +
        " dari " +
        questions.length;


    document.getElementById(
        "question"
    ).textContent =
        question.question;


    const answers =
        document.getElementById(
            "answers"
        );


    answers.innerHTML = "";


    question.options.forEach(
        (option, index) => {

            const button =
                document.createElement(
                    "button"
                );


            button.className =
                "answer";


            button.textContent =
                String.fromCharCode(
                    65 + index
                ) +
                ". " +
                option;


            button.onclick = () => {

                answerQuestion(index);

            };


            answers.appendChild(
                button
            );

        }
    );
}

async function answerQuestion(
    selected
) {

    const buttons =
        document.querySelectorAll(
            ".answer"
        );


    buttons.forEach(button => {
        button.disabled = true;
    });


    const question =
        questions[currentQuestion];


    try {

        const data = await api(
            "/api/answer",
            {
                method: "POST",

                body: JSON.stringify({

                    user_id:
                        currentUser.id,

                    question_id:
                        question.id,

                    answer:
                        selected

                })
            }
        );


        if (data.correct) {

            buttons[selected]
                .classList.add(
                    "correct"
                );


            currentScore +=
                data.points;


        } else {

            buttons[selected]
                .classList.add(
                    "wrong"
                );

        }


        document.getElementById(
            "quizScore"
        ).textContent =
            "⭐ " +
            currentScore;


        setTimeout(() => {

            currentQuestion++;

            showQuestion();

        }, 600);


    } catch (error) {

        alert(
            "Gagal mengirim jawaban:\n" +
            error.message
        );


        buttons.forEach(button => {
            button.disabled = false;
        });

    }
}

async function completeLevel() {

    try {

        const data = await api(
            "/api/complete-level",
            {
                method: "POST",

                body: JSON.stringify({
                    user_id:
                        currentUser.id
                })
            }
        );


        await refreshProfile();


        if (data.finished) {

            document.getElementById(
                "finalScore"
            ).textContent =
                currentUser.score;


            showPage("result");

            return;
        }


        alert(
            "🎉 " +
            data.message
        );


        await loadQuestions();


        currentQuestion = 0;

        currentScore =
            currentUser.score;


        showQuestion();

    } catch (error) {

        alert(
            "Gagal menyelesaikan level:\n" +
            error.message
        );

    }
}

async function loadLeaderboard() {

    const list =
        document.getElementById(
            "leaderboardList"
        );


    list.innerHTML =
        "<p>⏳ Memuat leaderboard...</p>";


    try {

        const data = await api(
            "/api/leaderboard"
        );


        list.innerHTML = "";


        if (
            data.users.length === 0
        ) {

            list.innerHTML =
                "<p>Belum ada pemain.</p>";

            return;
        }


        data.users.forEach(
            (user, index) => {

                const row =
                    document.createElement(
                        "div"
                    );


                row.className =
                    "rank";


                let medal =
                    (index + 1) + ".";


                if (index === 0)
                    medal = "🥇";

                else if (index === 1)
                    medal = "🥈";

                else if (index === 2)
                    medal = "🥉";


                row.innerHTML = `
                    <strong>
                        ${medal}
                        ${user.username}
                    </strong>

                    <span>
                        ⭐ ${user.score}
                    </span>
                `;


                list.appendChild(row);

            }
        );


    } catch (error) {

        list.innerHTML =
            "<p>❌ Gagal memuat leaderboard.</p>";

    }
}


function logout() {

    currentUser = null;

    currentScore = 0;

    localStorage.removeItem(
        "quizUser"
    );

    showPage("login");
}

document.getElementById(
    "loginBtn"
).onclick = login;


document.getElementById(
    "registerBtn"
).onclick = register;


document.getElementById(
    "startBtn"
).onclick = startGame;


document.getElementById(
    "leaderboardBtn"
).onclick = () => {

    showPage("leaderboard");

    loadLeaderboard();

};


document.getElementById(
    "resultLeaderboardBtn"
).onclick = () => {

    showPage("leaderboard");

    loadLeaderboard();

};


document.getElementById(
    "backHomeBtn"
).onclick = () => {

    refreshProfile();

    showPage("home");

};


document.getElementById(
    "playAgainBtn"
).onclick =
    startGame;


document.getElementById(
    "logoutBtn"
).onclick =
    logout;


document.getElementById(
    "showRegister"
).onclick = event => {

    event.preventDefault();

    showPage("register");

};


document.getElementById(
    "showLogin"
).onclick = event => {

    event.preventDefault();

    showPage("login");

};

const savedUser =
    localStorage.getItem(
        "quizUser"
    );


if (savedUser) {

    try {

        currentUser =
            JSON.parse(savedUser);

        refreshProfile();

        showPage("home");

    } catch {

        localStorage.removeItem(
            "quizUser"
        );

        showPage("login");

    }

} else {

    showPage("login");

}
