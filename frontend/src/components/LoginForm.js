import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase/firebase";

const LoginForm = () => {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [message, setMessage] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, pw);
      setMessage("로그인 성공!");
      // 이후 리디렉션 처리 추가 가능
    } catch (error) {
      console.error(error);
      setMessage(`에러: ${error.message}`);
    }
  };

  return (
    <form onSubmit={handleLogin} className="space-y-4">
      <h2 className="text-xl font-semibold">로그인</h2>
      
      <div>
        <label className="block mb-1">이메일</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="border p-2 w-full"
        />
      </div>

      <div>
        <label className="block mb-1">비밀번호</label>
        <input
          type="password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          required
          className="border p-2 w-full"
        />
      </div>

      <button type="submit" className="bg-black text-white px-4 py-2">
        로그인
      </button>

      {message && <p className="mt-2 text-sm text-red-600">{message}</p>}
    </form>
  );
};

export default LoginForm; 