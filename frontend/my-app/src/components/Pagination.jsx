import { Pagination as MuiPagination, Box } from '@mui/material';

const Pagination = ({ count, page, onChange }) => {
  return (
    <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
      <MuiPagination
        count={count}
        page={page}
        onChange={onChange}
        color="primary"
        showFirstButton
        showLastButton
      />
    </Box>
  );
};

export default Pagination;