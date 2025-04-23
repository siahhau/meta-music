// frontend/src/App.jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import SignIn from './pages/AuthPages/SignIn';
import SignUp from './pages/AuthPages/SignUp';
import NotFound from './pages/OtherPage/NotFound';
import UserProfiles from './pages/UserProfiles';
import Videos from './pages/UiElements/Videos';
import Images from './pages/UiElements/Images';
import Alerts from './pages/UiElements/Alerts';
import Badges from './pages/UiElements/Badges';
import Avatars from './pages/UiElements/Avatars';
import Buttons from './pages/UiElements/Buttons';
import LineChart from './pages/Charts/LineChart';
import BarChart from './pages/Charts/BarChart';
import Calendar from './pages/Calendar';
import BasicTables from './pages/Tables/BasicTables';
import FormElements from './pages/Forms/FormElements';
import Blank from './pages/Blank';
import AppLayout from './layout/AppLayout';
import { ScrollToTop } from './components/common/ScrollToTop';
import Home from './pages/Dashboard/Home';
import ProtectedRoute from './components/ProtectedRoute';
import ScoreUpload from './pages/ScoreUpload';
import TaskDashboard from './components/TaskDashboard';
import ReviewDashboard from './pages/ReviewDashboard';
import AlbumDetail from './pages/AlbumDetail';
import TrackDetail from './pages/TrackDetail';
import Tracks from './pages/Tracks';
import UserManagement from './pages/UserManagement';
import ScoreList from './pages/ScoreList';

// Custom Material-UI theme to match Tailwind CSS
const theme = createTheme({
  palette: {
    mode: 'light', // Default light mode
    primary: {
      main: '#3b82f6', // Tailwind blue-500
    },
    secondary: {
      main: '#6b7280', // Tailwind gray-500
    },
    success: {
      main: '#22c55e', // Tailwind green-500
    },
    error: {
      main: '#ef4444', // Tailwind red-500
    },
    warning: {
      main: '#eab308', // Tailwind yellow-500
    },
    background: {
      default: '#ffffff', // Tailwind white
      paper: '#ffffff',
    },
    text: {
      primary: '#1f2937', // Tailwind gray-800
      secondary: '#6b7280', // Tailwind gray-500
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#ffffff',
          color: '#1f2937',
          '&.dark': {
            backgroundColor: '#1f2937', // Tailwind gray-800
            color: '#e5e7eb', // Tailwind gray-200
          },
        },
      },
    },
  },
});

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <ScrollToTop />
        <Routes>
          <Route element={<AppLayout />}>
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Home />
                </ProtectedRoute>
              }
            />
            <Route path="/profile" element={<UserProfiles />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/blank" element={<Blank />} />
            <Route path="/tracks" element={<Tracks />} />
            <Route path="/form-elements" element={<FormElements />} />
            <Route path="/basic-tables" element={<BasicTables />} />
            <Route path="/users" element={<UserManagement />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/avatars" element={<Avatars />} />
            <Route path="/badge" element={<Badges />} />
            <Route path="/buttons" element={<Buttons />} />
            <Route path="/images" element={<Images />} />
            <Route path="/videos" element={<Videos />} />
            <Route path="/line-chart" element={<LineChart />} />
            <Route path="/bar-chart" element={<BarChart />} />
            <Route path="/tasks" element={<TaskDashboard />} />
            <Route path="/review" element={<ReviewDashboard />} />
            <Route path="/detail/album/:id" element={<AlbumDetail />} />
            <Route path="/detail/track/:id" element={<TrackDetail />} />
            <Route path="/scores/upload" element={<ScoreUpload />} />
            <Route path="/scores" element={<ScoreList />} />
          </Route>
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}