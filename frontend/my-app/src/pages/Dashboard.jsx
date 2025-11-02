import { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
} from '@mui/material';
import {
  LibraryBooks,
  People,
  MenuBook,
  Warning,
  CloudDownload,
} from '@mui/icons-material';
import { Line, Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { bookService } from '../services/api';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const Dashboard = () => {
  const [statistics, setStatistics] = useState({
    totalBooks: 0,
    totalUsers: 0,
    activeLoans: 0,
    overdueLoans: 0,
  });

  const [borrowingStats, setBorrowingStats] = useState({
    labels: [],
    data: [],
  });

  const [popularBooks, setPopularBooks] = useState({
    labels: [],
    data: [],
  });

  const [categoryDistribution, setCategoryDistribution] = useState({
    labels: [],
    data: [],
  });

  const fetchDashboardData = useCallback(async () => {
    try {
      const response = await bookService.getDashboardStats();
      setStatistics(response.data.statistics);
      setBorrowingStats({
        labels: response.data.borrowingTrends.labels,
        data: response.data.borrowingTrends.data,
      });
      setPopularBooks({
        labels: response.data.popularBooks.labels,
        data: response.data.popularBooks.data,
      });
      setCategoryDistribution({
        labels: response.data.categoryDistribution.labels,
        data: response.data.categoryDistribution.data,
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error?.response?.data || error.message);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleExportData = async (type) => {
    try {
      const response = await bookService.exportData(type);
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `library-${type}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exporting data:', error);
    }
  };

  const StatCard = ({ title, value, icon, color }) => (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          {icon}
          <Typography variant="h6" sx={{ ml: 1 }}>
            {title}
          </Typography>
        </Box>
        <Typography variant="h4" color={color}>
          {value}
        </Typography>
      </CardContent>
    </Card>
  );

  return (
    <Container>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Dashboard
        </Typography>
        <Box sx={{ mb: 2, display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<CloudDownload />}
            onClick={() => handleExportData('books')}
          >
            Export Books Data
          </Button>
          <Button
            variant="outlined"
            startIcon={<CloudDownload />}
            onClick={() => handleExportData('loans')}
          >
            Export Loans Data
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Statistics Cards */}
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Books"
            value={statistics.totalBooks}
            icon={<LibraryBooks color="primary" />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Users"
            value={statistics.totalUsers}
            icon={<People color="success" />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Loans"
            value={statistics.activeLoans}
            icon={<MenuBook color="info" />}
            color="info"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Overdue Loans"
            value={statistics.overdueLoans}
            icon={<Warning color="error" />}
            color="error"
          />
        </Grid>

        {/* Charts */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Borrowing Trends
            </Typography>
            <Line
              data={{
                labels: borrowingStats.labels,
                datasets: [
                  {
                    label: 'Number of Loans',
                    data: borrowingStats.data,
                    borderColor: 'rgb(75, 192, 192)',
                    tension: 0.1,
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                height: 300,
              }}
            />
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Category Distribution
            </Typography>
            <Pie
              data={{
                labels: categoryDistribution.labels,
                datasets: [
                  {
                    data: categoryDistribution.data,
                    backgroundColor: [
                      '#FF6384',
                      '#36A2EB',
                      '#FFCE56',
                      '#4BC0C0',
                      '#9966FF',
                    ],
                  },
                ],
              }}
            />
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Most Popular Books
            </Typography>
            <Bar
              data={{
                labels: popularBooks.labels,
                datasets: [
                  {
                    label: 'Times Borrowed',
                    data: popularBooks.data,
                    backgroundColor: 'rgba(54, 162, 235, 0.5)',
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                height: 300,
              }}
            />
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;