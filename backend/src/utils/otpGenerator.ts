
export const generateOTP = (): string => {
    // Generate a number between 100000 and 999999
    const otp = Math.floor(100000 + Math.random() * 900000);
    return otp.toString();
};
