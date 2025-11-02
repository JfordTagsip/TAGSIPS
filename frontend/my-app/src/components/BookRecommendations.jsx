import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Grid,
  Chip,
  Rating,
  Skeleton,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { bookService } from '../services/api';

const BookRecommendations = () => {
  const [recommendations, setRecommendations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    try {
      const response = await bookService.getRecommendations();
      setRecommendations(response.data);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const LoadingSkeleton = () => (
    <Grid container spacing={2}>
      {[1, 2, 3].map((item) => (
        <Grid item xs={12} sm={6} md={4} key={item}>
          <Card>
            <CardContent>
              <Skeleton variant="text" height={32} width="80%" />
              <Skeleton variant="text" height={24} width="60%" />
              <Box sx={{ mt: 1 }}>
                <Skeleton variant="text" width="40%" />
                <Skeleton variant="rectangular" height={60} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Recommended for You
      </Typography>
      {isLoading ? (
        <LoadingSkeleton />
      ) : (
        <Grid container spacing={2}>
          {recommendations.map((book) => (
            <Grid item xs={12} sm={6} md={4} key={book.id}>
              <Card>
                <CardContent>
                  <Typography variant="h6" noWrap>
                    {book.title}
                  </Typography>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    by {book.author}
                  </Typography>
                  <Box sx={{ mt: 1 }}>
                    <Rating value={book.rating} readOnly precision={0.5} size="small" />
                    <Typography variant="body2" color="text.secondary">
                      Match Score: {book.matchScore}%
                    </Typography>
                  </Box>
                  <Box sx={{ mt: 1 }}>
                    {book.categories.map((category) => (
                      <Chip
                        key={category}
                        label={category}
                        size="small"
                        sx={{ mr: 0.5, mb: 0.5 }}
                      />
                    ))}
                  </Box>
                  {book.reasonForRecommendation && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      {book.reasonForRecommendation}
                    </Typography>
                  )}
                </CardContent>
                <CardActions>
                  <Button size="small" onClick={() => navigate(`/books/${book.id}`)}>
                    View Details
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default BookRecommendations;