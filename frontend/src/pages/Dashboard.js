import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import AddIcon from "@mui/icons-material/Add";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import {
  alpha,
  Avatar,
  Box,
  Button,
  Card, CardContent,
  Chip,
  Container,
  Divider,
  Grid,
  IconButton,
  LinearProgress,
  List, ListItem, ListItemAvatar, ListItemText,
  Paper, Stack,
  Typography
} from "@mui/material";
import { format, subDays } from "date-fns";
import React from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Tooltip as ChartTooltip,
  ResponsiveContainer, XAxis, YAxis
} from "recharts";

// ========== DONNÉES FICTIVES ========== //
const userData = {
  name: "Luka",
  avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Luka"
};

const portfolioData = {
  totalBalance: 124847.32,
  totalGain: 12420.18,
  gainPercent: 11.05,
  monthlyProfit: 4523.67,
  monthlyProfitPercent: 3.76,
  weeklyProfit: 1205.43,
  weeklyProfitPercent: 0.98
};

const accounts = [
  { id: 1, name: "Trading Principal", balance: 84320.50, change: 5.2, color: "#6366f1" },
  { id: 2, name: "Crypto Portfolio", balance: 28450.12, change: -2.1, color: "#8b5cf6" },
  { id: 3, name: "Options Trading", balance: 12076.70, change: 8.7, color: "#ec4899" }
];

const recentTrades = [
  { id: 1, asset: "AAPL", type: "BUY", amount: 2450.00, date: "2025-11-15T14:30:00", profit: true },
  { id: 2, asset: "BTC/USD", type: "SELL", amount: -1820.50, date: "2025-11-15T11:20:00", profit: false },
  { id: 3, asset: "TSLA", type: "BUY", amount: 3100.00, date: "2025-11-14T16:45:00", profit: true },
  { id: 4, asset: "ETH/USD", type: "SELL", amount: 1650.25, date: "2025-11-14T09:15:00", profit: true },
  { id: 5, asset: "NVDA", type: "BUY", amount: -890.00, date: "2025-11-13T13:00:00", profit: false }
];

const performanceHistory = Array.from({ length: 30 }, (_, i) => {
  const baseValue = 112000;
  const variation = Math.sin(i / 3) * 5000 + Math.random() * 3000;
  return {
    date: format(subDays(new Date(), 29 - i), "dd MMM"),
    value: Math.round(baseValue + variation + (i * 420))
  };
});

const goals = [
  { id: 1, title: "Objectif mensuel", current: 4523, target: 5000, color: "#10b981" },
  { id: 2, title: "Portefeuille diversifié", current: 78, target: 100, color: "#3b82f6", isPercent: true }
];

// ========== COMPOSANTS UI ========== //
const StatCard = ({ title, value, change, changePercent, icon: Icon, color }) => {
  const isPositive = change >= 0;
  
  return (
    <Card 
      elevation={0}
      sx={{ 
        borderRadius: 4,
        border: '1px solid',
        borderColor: 'divider',
        height: '100%',
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 12px 24px rgba(0,0,0,0.08)'
        }
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Typography variant="body2" color="text.secondary" fontWeight={500}>
            {title}
          </Typography>
          <Box 
            sx={{ 
              p: 1, 
              borderRadius: 2, 
              bgcolor: alpha(color, 0.1),
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <Icon sx={{ fontSize: 20, color }} />
          </Box>
        </Box>
        
        <Typography variant="h4" fontWeight={700} sx={{ mb: 1 }}>
          ${value.toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {isPositive ? (
            <TrendingUpIcon sx={{ fontSize: 16, color: '#10b981' }} />
          ) : (
            <TrendingDownIcon sx={{ fontSize: 16, color: '#ef4444' }} />
          )}
          <Typography 
            variant="body2" 
            sx={{ color: isPositive ? '#10b981' : '#ef4444', fontWeight: 600 }}
          >
            {isPositive ? '+' : ''}{change.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            ({isPositive ? '+' : ''}{changePercent}%)
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

const PerformanceChart = () => {
  return (
    <Card 
      elevation={0}
      sx={{ 
        borderRadius: 4,
        border: '1px solid',
        borderColor: 'divider',
        height: '100%'
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h6" fontWeight={700}>Performance du portefeuille</Typography>
            <Typography variant="body2" color="text.secondary">30 derniers jours</Typography>
          </Box>
          <Chip label="1M" size="small" color="primary" />
        </Box>
        
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={performanceHistory}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="date" 
              stroke="#9ca3af"
              style={{ fontSize: 12 }}
            />
            <YAxis 
              stroke="#9ca3af"
              style={{ fontSize: 12 }}
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
            />
            <ChartTooltip 
              contentStyle={{ 
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: 8,
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}
              formatter={(value) => `$${value.toLocaleString()}`}
            />
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke="#6366f1" 
              strokeWidth={2}
              fill="url(#colorValue)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

const AccountsList = () => {
  return (
    <Card 
      elevation={0}
      sx={{ 
        borderRadius: 4,
        border: '1px solid',
        borderColor: 'divider'
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" fontWeight={700}>Mes comptes</Typography>
          <IconButton size="small">
            <AddIcon />
          </IconButton>
        </Box>
        
        <Stack spacing={2}>
          {accounts.map((account) => (
            <Paper
              key={account.id}
              elevation={0}
              sx={{
                p: 2,
                borderRadius: 3,
                bgcolor: alpha(account.color, 0.05),
                border: '1px solid',
                borderColor: alpha(account.color, 0.1),
                transition: 'all 0.2s',
                cursor: 'pointer',
                '&:hover': {
                  borderColor: account.color,
                  bgcolor: alpha(account.color, 0.08)
                }
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Box 
                    sx={{ 
                      width: 8, 
                      height: 8, 
                      borderRadius: '50%', 
                      bgcolor: account.color 
                    }} 
                  />
                  <Box>
                    <Typography variant="body2" fontWeight={600}>{account.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      ${account.balance.toLocaleString()}
                    </Typography>
                  </Box>
                </Box>
                <Chip 
                  label={`${account.change > 0 ? '+' : ''}${account.change}%`}
                  size="small"
                  sx={{
                    bgcolor: account.change > 0 ? alpha('#10b981', 0.1) : alpha('#ef4444', 0.1),
                    color: account.change > 0 ? '#10b981' : '#ef4444',
                    fontWeight: 600
                  }}
                />
              </Box>
            </Paper>
          ))}
        </Stack>
      </CardContent>
    </Card>
  );
};

const RecentActivity = () => {
  return (
    <Card 
      elevation={0}
      sx={{ 
        borderRadius: 4,
        border: '1px solid',
        borderColor: 'divider'
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" fontWeight={700}>Activité récente</Typography>
          <IconButton size="small">
            <MoreVertIcon />
          </IconButton>
        </Box>
        
        <List sx={{ p: 0 }}>
          {recentTrades.slice(0, 5).map((trade, index) => (
            <React.Fragment key={trade.id}>
              <ListItem sx={{ px: 0, py: 1.5 }}>
                <ListItemAvatar>
                  <Avatar 
                    sx={{ 
                      bgcolor: trade.profit ? alpha('#10b981', 0.1) : alpha('#ef4444', 0.1),
                      color: trade.profit ? '#10b981' : '#ef4444'
                    }}
                  >
                    <SwapHorizIcon />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Typography variant="body2" fontWeight={600}>
                      {trade.asset}
                    </Typography>
                  }
                  secondary={
                    <Typography variant="caption" color="text.secondary">
                      {format(new Date(trade.date), "dd MMM, HH:mm")}
                    </Typography>
                  }
                />
                <Typography 
                  variant="body2" 
                  fontWeight={700}
                  sx={{ color: trade.amount > 0 ? '#10b981' : '#ef4444' }}
                >
                  {trade.amount > 0 ? '+' : ''}${Math.abs(trade.amount).toLocaleString()}
                </Typography>
              </ListItem>
              {index < recentTrades.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>
      </CardContent>
    </Card>
  );
};

const Goals = () => {
  return (
    <Card 
      elevation={0}
      sx={{ 
        borderRadius: 4,
        border: '1px solid',
        borderColor: 'divider'
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Typography variant="h6" fontWeight={700} sx={{ mb: 3 }}>Objectifs</Typography>
        
        <Stack spacing={3}>
          {goals.map((goal) => {
            const progress = goal.isPercent 
              ? goal.current 
              : (goal.current / goal.target) * 100;
            
            return (
              <Box key={goal.id}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" fontWeight={600}>
                    {goal.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {goal.isPercent 
                      ? `${goal.current}%` 
                      : `$${goal.current.toLocaleString()} / $${goal.target.toLocaleString()}`
                    }
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={progress}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    bgcolor: alpha(goal.color, 0.1),
                    '& .MuiLinearProgress-bar': {
                      bgcolor: goal.color,
                      borderRadius: 4
                    }
                  }}
                />
              </Box>
            );
          })}
        </Stack>
      </CardContent>
    </Card>
  );
};

// ========== DASHBOARD PRINCIPAL ========== //
export default function TradingDashboard() {
  return (
    <Box sx={{ bgcolor: '#f8fafc', minHeight: '100vh', py: 4 }}>
      <Container maxWidth="lg" sx={{ px: { xs: 2, md: 3 } }}>
        {/* HEADER */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar src={userData.avatar} sx={{ width: 56, height: 56 }} />
            <Box>
              <Typography variant="h5" fontWeight={700}>
                Bonjour, {userData.name} 👋
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {format(new Date(), "EEEE dd MMMM yyyy")}
              </Typography>
            </Box>
          </Box>
          <Button 
            variant="contained" 
            startIcon={<FileDownloadIcon />}
            sx={{ 
              borderRadius: 3,
              textTransform: 'none',
              px: 3,
              py: 1.5,
              boxShadow: 'none',
              '&:hover': {
                boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
              }
            }}
          >
            Exporter
          </Button>
        </Box>

        {/* STATS PRINCIPALES */}
        <Box
          sx={{
            display: 'grid',
            gap: { xs: 2, md: 3 },
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, minmax(0, 1fr))',
              lg: 'repeat(3, minmax(0, 1fr))'
            },
            mb: 3
          }}
        >
          <StatCard 
            title="Solde total"
            value={portfolioData.totalBalance}
            change={portfolioData.totalGain}
            changePercent={portfolioData.gainPercent}
            icon={AccountBalanceWalletIcon}
            color="#6366f1"
          />
          <StatCard 
            title="Profit mensuel"
            value={portfolioData.monthlyProfit}
            change={portfolioData.monthlyProfit}
            changePercent={portfolioData.monthlyProfitPercent}
            icon={TrendingUpIcon}
            color="#10b981"
          />
          <StatCard 
            title="Profit hebdomadaire"
            value={portfolioData.weeklyProfit}
            change={portfolioData.weeklyProfit}
            changePercent={portfolioData.weeklyProfitPercent}
            icon={TrendingUpIcon}
            color="#8b5cf6"
          />
        </Box>

        {/* GRAPHIQUE PRINCIPAL + COMPTES */}
        <Box
          sx={{
            display: 'grid',
            gap: { xs: 2, md: 3 },
            gridTemplateColumns: {
              xs: '1fr',
              lg: 'minmax(0, 1.9fr) minmax(280px, 1fr)'
            },
            alignItems: 'stretch',
            mb: 3
          }}
        >
          <PerformanceChart />
          <AccountsList />
        </Box>

        {/* ACTIVITÉ + OBJECTIFS */}
        <Box
          sx={{
            display: 'grid',
            gap: { xs: 2, md: 3 },
            gridTemplateColumns: {
              xs: '1fr',
              md: 'repeat(2, minmax(0, 1fr))',
              lg: 'minmax(0, 1.6fr) minmax(0, 1fr)'
            }
          }}
        >
          <RecentActivity />
          <Goals />
        </Box>
      </Container>
    </Box>
  );
}
