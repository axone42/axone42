export type ContactErrors = Partial<Record<"name" | "email" | "message" | "agree", string>>;
export function validateContact(data: {name: string; email: string; message: string; agree: boolean}): ContactErrors {
  const errors: ContactErrors = {};
  if (data.name.trim().length < 2 || data.name.length > 100) errors.name = "이름을 2~100자로 입력해 주세요.";
  if (data.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) errors.email = "올바른 이메일을 입력해 주세요.";
  if (data.message.trim().length < 5 || data.message.length > 5000) errors.message = "문의 내용을 5~5,000자로 입력해 주세요.";
  if (!data.agree) errors.agree = "개인정보 수집·이용에 동의해 주세요.";
  return errors;
}
