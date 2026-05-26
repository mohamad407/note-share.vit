/* ============================================
   NOTEVAULT — FULLY FIXED SCRIPT.JS
   ============================================ */

// ============================================
// API BASE
// ============================================
localStorage.removeItem('notevault_user');
const API_BASE = 'https://note-share-vit.onrender.com';

// ============================================
// FIREBASE AUTH
// ============================================

const auth = firebase.auth();

const provider = new firebase.auth.GoogleAuthProvider();

let currentUser = null;

// ============================================
// GLOBAL VARIABLES
// ============================================

let allNotes = [];
let searchTimeout = null;
let selectedFile = null;
let selectedFileData = null;
let uploadMode = 'file';
let deleteTargetId = null;

const MAX_FILE_SIZE = 50 * 1024 * 1024;
const ALLOWED_TYPE = 'application/pdf';

// ============================================
// SAVE USER
// ============================================

function saveUser(user) {

    currentUser = user;

    localStorage.setItem(
        'notevault_user',
        JSON.stringify(user)
    );
}

// ============================================
// GET SAVED USER
// ============================================

function getSavedUser() {

    const user =
        localStorage.getItem('notevault_user');

    return user ? JSON.parse(user) : null;
}

// ============================================
// LOGOUT USER
// ============================================

function logoutUser() {

    localStorage.removeItem(
        'notevault_user'
    );

    currentUser = null;

    location.reload();
}

// ============================================
// UPDATE AUTH UI
// ============================================

function updateAuthUI() {

    const loginBtn =
        document.getElementById('googleLoginBtn');

    const userBox =
        document.getElementById('userProfileBox');

    const userName =
        document.getElementById('userName');

    const userEmail =
        document.getElementById('userEmail');

    const userPhoto =
        document.getElementById('userPhoto');

    // USER LOGGED IN
    if (currentUser) {

        // KEEP LOGIN BUTTON VISIBLE
        if (loginBtn) {

            loginBtn.innerText =
                'Logged In Successfully';

            loginBtn.disabled = true;

            loginBtn.style.opacity = '0.7';
        }

        // SHOW USER PROFILE IF EXISTS
        if (userBox) {
            userBox.style.display = 'flex';
        }

        // SAFE NULL CHECKS
        if (userName) {
            userName.innerText =
                currentUser.name || '';
        }

        if (userEmail) {
            userEmail.innerText =
                currentUser.email || '';
        }

        if (userPhoto) {
            userPhoto.src =
                currentUser.photo || '';
        }

    }

    // USER NOT LOGGED IN
    else {

        if (loginBtn) {

            loginBtn.innerText =
                'Login with VIT Mail';

            loginBtn.disabled = false;

            loginBtn.style.opacity = '1';
        }

        if (userBox) {
            userBox.style.display = 'none';
        }
    }
}

// ============================================
// CHECK LOGIN STATE
// ============================================

function checkLoginState() {

    const savedUser = getSavedUser();

    if (savedUser) {

        currentUser = savedUser;

        updateAuthUI();
    }
}

// ============================================
// INIT GOOGLE AUTH
// ============================================

function initGoogleAuth() {

    const loginBtn =
        document.getElementById(
            'googleLoginBtn'
        );

    if (!loginBtn) return;

    loginBtn.addEventListener(
        'click',
        async () => {

            try {

                const result =
                    await firebase
                        .auth()
                        .signInWithPopup(
                            provider
                        );

                const user = result.user;

                // ONLY VIT MAILS
                if (
                    !user.email.endsWith(
                        '@vitstudent.ac.in'
                    )
                ) {

                    alert(
                        'Only VIT student emails allowed'
                    );

                    await firebase
                        .auth()
                        .signOut();

                    return;
                }

                const userData = {

                    uid: user.uid,

                    name:
                        user.displayName,

                    email:
                        user.email,

                    photo:
                        user.photoURL
                };

                saveUser(userData);

                updateAuthUI();

                showToast(
                    'Login successful!',
                    'success'
                );

            } catch (error) {

                console.error(
                    'Google Login Error:',
                    error
                );

                alert(error.message);
            }
        }
    );

    // LOGOUT
    const logoutBtn =
        document.getElementById(
            'logoutBtn'
        );

    if (logoutBtn) {

        logoutBtn.addEventListener(
            'click',
            async () => {

                await firebase
                    .auth()
                    .signOut();

                logoutUser();
            }
        );
    }
}

// ============================================
// GET UPLOADER ID
// ============================================

function getUploaderId() {

    let id =
        localStorage.getItem(
            'notevault_uploader_id'
        );

    if (!id) {

        id =
            'user_' +
            Date.now().toString(36) +
            '_' +
            Math.random()
                .toString(36)
                .slice(2, 10);

        localStorage.setItem(
            'notevault_uploader_id',
            id
        );
    }

    return id;
}

const MY_UPLOADER_ID =
    getUploaderId();

// ============================================
// DOM CONTENT LOADED
// ============================================

document.addEventListener(
    'DOMContentLoaded',
    () => {

        initGoogleAuth();

        checkLoginState();

        initFileUpload();

        initForm();

        fetchAndRenderNotes();

        initSearch();
    }
);

// ============================================
// FILE UPLOAD
// ============================================

function initFileUpload() {

    const fileInput =
        document.getElementById(
            'fileInput'
        );

    if (!fileInput) return;

    fileInput.addEventListener(
        'change',
        (e) => {

            const file =
                e.target.files[0];

            if (!file) return;

            // ONLY PDF
            if (
                file.type !==
                ALLOWED_TYPE
            ) {

                showToast(
                    'Only PDF files allowed',
                    'error'
                );

                return;
            }

            // SIZE LIMIT
            if (
                file.size >
                MAX_FILE_SIZE
            ) {

                showToast(
                    'Max file size is 50MB',
                    'error'
                );

                return;
            }

            selectedFile = file;

            const reader =
                new FileReader();

            reader.onload = (e) => {

                selectedFileData =
                    e.target.result;
            };

            reader.readAsDataURL(
                file
            );

            showToast(
                'PDF selected successfully',
                'success'
            );
        }
    );
}

// ============================================
// FORM SUBMIT
// ============================================

function initForm() {

    const form =
        document.getElementById(
            'uploadForm'
        );

    if (!form) return;

    form.addEventListener(
        'submit',
        async (e) => {

            e.preventDefault();

            if (!currentUser) {

                showToast(
                    'Please login first',
                    'error'
                );

                return;
            }

            if (!selectedFileData) {

                showToast(
                    'Please upload PDF',
                    'error'
                );

                return;
            }

            const data = {

                courseCode:
                    document
                        .getElementById(
                            'courseCode'
                        )
                        .value
                        .trim(),

                courseName:
                    document
                        .getElementById(
                            'courseName'
                        )
                        .value
                        .trim(),

                department:
                    document
                        .getElementById(
                            'department'
                        )
                        .value
                        .trim(),

                semester:
                    document
                        .getElementById(
                            'semester'
                        )
                        .value
                        .trim(),

                facultyName:
                    document
                        .getElementById(
                            'facultyName'
                        )
                        .value
                        .trim(),

                unitNumber:
                    document
                        .getElementById(
                            'unitNumber'
                        )
                        .value
                        .trim(),

                uploaderId:
                    currentUser.uid,

                uploaderEmail:
                    currentUser.email,

                uploaderName:
                    currentUser.name,

                pdfUrl:
                    selectedFileData
            };

            try {

                const response =
                    await fetch(
                        `${API_BASE}/upload`,
                        {
                            method:
                                'POST',

                            headers: {
                                'Content-Type':
                                    'application/json'
                            },

                            body:
                                JSON.stringify(
                                    data
                                )
                        }
                    );

                const result =
                    await response.json();

                if (response.ok) {

                    showToast(
                        'Upload successful!',
                        'success'
                    );

                    form.reset();

                    selectedFile = null;

                    selectedFileData =
                        null;

                    fetchAndRenderNotes();

                } else {

                    showToast(
                        result.message ||
                            'Upload failed',
                        'error'
                    );
                }

            } catch (error) {

                console.error(error);

                showToast(
                    'Server Error',
                    'error'
                );
            }
        }
    );
}

// ============================================
// FETCH NOTES
// ============================================

async function fetchAndRenderNotes() {

    try {

        const response =
            await fetch(
                `${API_BASE}/notes`
            );

        const result =
            await response.json();

        if (response.ok) {

            allNotes =
                result.notes || [];

            console.log(
                'Notes Loaded',
                allNotes
            );
        }

    } catch (error) {

        console.error(
            'Fetch Error',
            error
        );
    }
}

// ============================================
// SEARCH
// ============================================

function initSearch() {

    const input =
        document.getElementById(
            'searchInput'
        );

    if (!input) return;

    input.addEventListener(
        'input',
        () => {

            clearTimeout(
                searchTimeout
            );

            searchTimeout =
                setTimeout(() => {

                    performSearch(
                        input.value.trim()
                    );

                }, 300);
        }
    );
}

// ============================================
// SEARCH FUNCTION
// ============================================

function performSearch(query) {

    console.log(
        'Searching:',
        query
    );
}

// ============================================
// TOAST
// ============================================

function showToast(
    message,
    type = 'success'
) {

    console.log(
        `${type.toUpperCase()}: ${message}`
    );

    alert(message);
}
