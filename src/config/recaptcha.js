export const RECAPTCHA_SITE_KEY = "6LcZHc8rAAAAAFHKILH9WfNsi3d1vLe2rpN4IUhp";
export const RECAPTCHA_SECRET_KEY = "6LcZHc8rAAAAACrrzO5haGc0GCIr2TVphrKzOpLf";

export const RECAPTCHA_CONFIG = {
  siteKey: RECAPTCHA_SITE_KEY,
  secretKey: RECAPTCHA_SECRET_KEY,
};

// Utility function to verify reCAPTCHA token on the server side
export async function verifyRecaptchaToken(token) {
  try {
    const response = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        secret: RECAPTCHA_SECRET_KEY,
        response: token,
      }),
    });

    const data = await response.json();
    return data.success === true;
  } catch (error) {
    console.error("reCAPTCHA verification error:", error);
    return false;
  }
}
