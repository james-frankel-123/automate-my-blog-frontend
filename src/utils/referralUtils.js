// Referral Utilities
export const getReferralCodeFromURL = () => {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('ref');
};

export const getInviteCodeFromURL = () => {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('invite');
};

// Store referral/invite codes in session storage when user arrives
export const storeReferralInfo = () => {
  // Prevent duplicate checks in the same session
  if (sessionStorage.getItem('referralChecked')) {
    return;
  }
  
  const referralCode = getReferralCodeFromURL();
  const inviteCode = getInviteCodeFromURL();
  
  if (referralCode) {
    sessionStorage.setItem('referralCode', referralCode);
  }
  
  if (inviteCode) {
    sessionStorage.setItem('inviteCode', inviteCode);
  }
  
  // Mark as checked to prevent duplicate logging
  sessionStorage.setItem('referralChecked', 'true');
};

// Retrieve stored referral/invite codes
export const getStoredReferralCode = () => {
  return sessionStorage.getItem('referralCode');
};

export const getStoredInviteCode = () => {
  return sessionStorage.getItem('inviteCode');
};

// Clear stored codes after successful registration
export const clearStoredReferralInfo = () => {
  sessionStorage.removeItem('referralCode');
  sessionStorage.removeItem('inviteCode');
};

// Check if user arrived via referral or invite
export const hasReferralInfo = () => {
  return !!(getStoredReferralCode() || getStoredInviteCode());
};