// 1. まず「Firebaseの道具箱から、これらの道具を使います！」と宣言します
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// 2. 環境変数からFirebase設定を読み込みます
let firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// 必要な環境変数が設定されているかチェックします
if (!firebaseConfig.apiKey || !firebaseConfig.projectId || !firebaseConfig.authDomain) {
  console.warn(
    'Firebase設定が正しくありません。環境変数を確認してください。\n' +
    '必要な変数: NEXT_PUBLIC_FIREBASE_API_KEY, NEXT_PUBLIC_FIREBASE_PROJECT_ID, NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN'
  );
  
  // ビルド時はダミー設定を使用
  firebaseConfig = {
    apiKey: "dummy-api-key",
    authDomain: "dummy-project.firebaseapp.com",
    projectId: "dummy-project",
    storageBucket: "dummy-project.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:dummy",
    measurementId: "G-DUMMY123"
  };
}

// 3. 「この接続コードを使って、アプリの電源を入れます！」という、一番大事な命令です
const app = initializeApp(firebaseConfig);

// 4. これからよく使う機能を、使いやすいように別名で用意しておきます
// 「auth」はログイン担当、「db」はデータ保存担当、という感じです
export const auth = getAuth(app);
export const db = getFirestore(app);
