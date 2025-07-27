// Mock Firebase module to match the actual structure
export const auth = {
  onAuthStateChanged: jest.fn(),
  currentUser: null,
};

export const provider = {};

export const signInWithPopup = jest.fn();

export const signOut = jest.fn();
