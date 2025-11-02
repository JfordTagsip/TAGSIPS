import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  isLoading: false,
  snackbar: {
    open: false,
    message: '',
    severity: 'info', // 'error' | 'warning' | 'info' | 'success'
  },
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    showSnackbar: (state, action) => {
      state.snackbar = {
        open: true,
        message: action.payload.message,
        severity: action.payload.severity || 'info',
      };
    },
    hideSnackbar: (state) => {
      state.snackbar.open = false;
    },
  },
});

export const { setLoading, showSnackbar, hideSnackbar } = uiSlice.actions;
export default uiSlice.reducer;