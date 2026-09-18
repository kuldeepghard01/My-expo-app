import React, { useState, useEffect } from 'react';
import { Text, View, FlatList, Image, TouchableOpacity, SafeAreaView, Modal, TextInput } from 'react-native';
import { styles } from './styles';
import Admin from './Admin';

const SUPABASE_URL = "https://zlgwkwdpswdnuuetzhle.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpsZ3drd2Rwc3dkbnV1ZXR6aGxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0NTEyNjUsImV4cCI6MjA3MjAyNzI2NX0.cDTOhQUvBIw4PwqthRCP3Q_5pZUTq1nUEskWZvWVtMM";
const ADMIN_PHONE = "9001641023";

const getHeaders = () => ({
  'Content-Type': 'application/json',
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Prefer': 'return=representation'
});

export default function App() {
  const [activeTab, setActiveTab] = useState('contests');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  const [walletBalance, setWalletBalance] = useState(500);
  const [moviesList, setMoviesList] = useState([]);
  const [leaderboardData, setLeaderboardData] = useState([]);

  const [predictModal, setPredictModal] = useState(false);
  const [boardModal, setBoardModal] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [predictionVal, setPredictionVal] = useState('');

  const fetchMovies = async () => {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/Movies?select=*`, { method: 'GET', headers: getHeaders() });
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) setMoviesList(data);
    } catch (err) {}
  };

  const fetchLeaderboard = async () => {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/predictions?select=*`, { method: 'GET', headers: getHeaders() });
      const data = await response.json();
      if (Array.isArray(data)) setLeaderboardData(data);
    } catch (err) {}
  };

  useEffect(() => { fetchMovies(); fetchLeaderboard(); }, []);

  const handleSendOtp = () => {
    if (!userName.trim() || !phoneNumber || phoneNumber.length < 10) return alert('Enter valid Name and Phone.');
    setOtpSent(true);
  };

  const handleVerifyOtp = () => {
    if (otp === '123456' || otp === '1234') setIsLoggedIn(true);
    else alert('Invalid OTP. Use 1234');
  };

  const isContestLocked = (lockDateStr) => {
    if (!lockDateStr) return false;
    const lockTime = new Date(lockDateStr).getTime();
    return new Date().getTime() >= lockTime;
  };

  const handleAddMovieByAdmin = async (title, category, release_date, lock_date, banner, entry_fee) => {
    if (!title || !release_date || !banner) return false;

    const isDuplicate = moviesList.some(m => m.title?.toLowerCase().trim() === title?.toLowerCase().trim());
    if (isDuplicate) return false;

    const newMovieObj = { title, category, release_date, lock_date, banner, entry_fee: parseFloat(entry_fee) || 10 };
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/Movies`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(newMovieObj) });
    } catch (e) {}

    setMoviesList(prev => [newMovieObj, ...prev]);
    return true;
  };

  // EDIT MOVIE BY ADMIN
  const handleEditMovieByAdmin = async (oldTitle, updatedData) => {
    try {
      const target = moviesList.find(m => m.title?.toLowerCase() === oldTitle?.toLowerCase());
      if (!target) return alert('Movie not found!');

      const updatedMovie = { ...target, ...updatedData };
      
      // Local state update
      setMoviesList(prev => prev.map(m => m.title?.toLowerCase() === oldTitle?.toLowerCase() ? updatedMovie : m));

      // Supabase Update
      if (target.id) {
        await fetch(`${SUPABASE_URL}/rest/v1/Movies?id=eq.${target.id}`, {
          method: 'PATCH',
          headers: getHeaders(),
          body: JSON.stringify(updatedData)
        });
      }
      alert(`✅ Updated ${oldTitle} successfully!`);
    } catch (err) {
      alert("Edit Error: " + err.message);
    }
  };

  const getMovieStats = (movieTitle, entryFee = 10) => {
    const movieEntries = leaderboardData.filter(p => p.movie_title?.toLowerCase() === movieTitle?.toLowerCase());
    const totalEntries = movieEntries.length;
    const totalCollected = totalEntries * entryFee;
    const totalPrizePool = Math.round(totalCollected * 0.8);

    return {
      entriesCount: totalEntries,
      totalCollected,
      totalPrizePool,
      rank1Prize: Math.round(totalPrizePool * 0.5),
      rank2Prize: Math.round(totalPrizePool * 0.3),
      rank3Prize: Math.round(totalPrizePool * 0.2),
      isTicketUnlocked: totalEntries >= 1000,
      movieEntries
    };
  };

  const handlePredictClick = async () => {
    if (!predictionVal || isNaN(predictionVal)) return alert('Enter valid prediction.');
    const fee = selectedMovie?.entry_fee || 10;
    if (walletBalance < fee) return alert('Insufficient Wallet Balance!');

    const newEntry = { movie_title: selectedMovie.title, category: 'Day 1', predicted_amount: parseFloat(predictionVal), user_phone: `${userName} (${phoneNumber})`, payment_status: 'SUCCESS' };
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/predictions`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(newEntry) });
    } catch (e) {}

    setWalletBalance(prev => prev - fee);
    setLeaderboardData(prev => [newEntry, ...prev]);
    setPredictModal(false);
    setPredictionVal('');
    alert('🎉 Prediction Entry Submitted!');
  };

  const handleDeclareWinner = (targetMovie, actualCollection) => {
    if (!targetMovie || !actualCollection) return alert('Enter Movie Title & Collection.');
    const moviePredictions = leaderboardData.filter(p => p.movie_title?.toLowerCase() === targetMovie.toLowerCase());
    if (moviePredictions.length === 0) return alert('No predictions found for this movie.');

    const actual = parseFloat(actualCollection);

    const sorted = moviePredictions.map(p => ({
      ...p,
      diff: Math.abs(parseFloat(p.predicted_amount) - actual)
    })).sort((a, b) => a.diff - b.diff);

    const stats = getMovieStats(targetMovie, 10);
    const win1 = sorted[0];
    const win2 = sorted[1];
    const win3 = sorted[2];

    let resultMsg = `🎉 WINNERS DECLARED FOR ${targetMovie.toUpperCase()}\nActual Collection: ₹${actual} Cr\n\n`;

    if (win1) {
      resultMsg += `🥇 1st Rank: ${win1.user_phone}\nPredicted: ₹${win1.predicted_amount} Cr (Diff: ${win1.diff.toFixed(2)})\nPrize: ₹${stats.rank1Prize} ${stats.isTicketUnlocked ? '+ 🎟️ Ticket' : ''}\n\n`;
      if (win1.user_phone.includes(phoneNumber)) setWalletBalance(p => p + stats.rank1Prize);
    }
    if (win2) {
      resultMsg += `🥈 2nd Rank: ${win2.user_phone}\nPredicted: ₹${win2.predicted_amount} Cr (Diff: ${win2.diff.toFixed(2)})\nPrize: ₹${stats.rank2Prize}\n\n`;
      if (win2.user_phone.includes(phoneNumber)) setWalletBalance(p => p + stats.rank2Prize);
    }
    if (win3) {
      resultMsg += `🥉 3rd Rank: ${win3.user_phone}\nPredicted: ₹${win3.predicted_amount} Cr (Diff: ${win3.diff.toFixed(2)})\nPrize: ₹${stats.rank3Prize}\n`;
      if (win3.user_phone.includes(phoneNumber)) setWalletBalance(p => p + stats.rank3Prize);
    }

    alert(resultMsg);
  };

  const handleAddWalletAdmin = (user, amount) => {
    if (!amount || isNaN(amount)) return alert('Enter valid amount.');
    setWalletBalance(p => p + parseFloat(amount));
    alert(`✅ Added ₹${amount} to Wallet!`);
  };

  const filteredMovies = selectedCategory === 'ALL' ? moviesList : moviesList.filter(m => m.category?.toLowerCase() === selectedCategory.toLowerCase());
  const userJoinedMovies = moviesList.filter(movie => leaderboardData.some(p => p.movie_title?.toLowerCase() === movie.title?.toLowerCase() && p.user_phone?.includes(phoneNumber)));

  if (!isLoggedIn) {
    return (
      <SafeAreaView style={styles.authContainer}>
        <View style={styles.authCard}>
          <Text style={styles.authLogo}>🎬 MCP Fantasy</Text>
          <Text style={styles.authSub}>Predict Box Office & Win Real Cash!</Text>
          {!otpSent ? (
            <View>
              <Text style={styles.label}>Name:</Text>
              <TextInput style={styles.input} value={userName} onChangeText={setUserName} placeholder="Enter Name" placeholderTextColor="#666" />
              <Text style={styles.label}>Phone:</Text>
              <TextInput style={styles.input} keyboardType="phone-pad" value={phoneNumber} onChangeText={setPhoneNumber} placeholder="10 Digit Phone" placeholderTextColor="#666" maxLength={10} />
              <TouchableOpacity style={styles.primaryBtn} onPress={handleSendOtp}><Text style={styles.primaryBtnText}>Get OTP</Text></TouchableOpacity>
            </View>
          ) : (
            <View>
              <Text style={styles.label}>OTP (1234):</Text>
              <TextInput style={styles.input} keyboardType="number-pad" value={otp} onChangeText={setOtp} placeholder="1234" placeholderTextColor="#666" />
              <TouchableOpacity style={styles.primaryBtn} onPress={handleVerifyOtp}><Text style={styles.primaryBtnText}>Verify OTP</Text></TouchableOpacity>
            </View>
          )}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.logoText}>🎬 MCP Fantasy</Text>
          <Text style={{ color: '#aaa', fontSize: 10 }}>👤 {userName} {phoneNumber === ADMIN_PHONE ? '(Admin)' : ''}</Text>
        </View>
        <View style={styles.walletBadge}><Text style={styles.walletText}>👛 ₹{walletBalance}</Text></View>
      </View>

      <View style={styles.tabBar}>
        <TouchableOpacity style={[styles.tabItem, activeTab === 'contests' && styles.activeTab]} onPress={() => setActiveTab('contests')}><Text style={styles.tabText}>🔥 Contests</Text></TouchableOpacity>
        <TouchableOpacity style={[styles.tabItem, activeTab === 'mycontests' && styles.activeTab]} onPress={() => setActiveTab('mycontests')}><Text style={styles.tabText}>🎯 My Contests</Text></TouchableOpacity>
        <TouchableOpacity style={[styles.tabItem, activeTab === 'profile' && styles.activeTab]} onPress={() => setActiveTab('profile')}><Text style={styles.tabText}>👤 Profile</Text></TouchableOpacity>
        {phoneNumber === ADMIN_PHONE && (
          <TouchableOpacity style={[styles.tabItem, activeTab === 'admin' && styles.activeTab]} onPress={() => setActiveTab('admin')}><Text style={{ color: '#e50914', fontWeight: 'bold', fontSize: 11 }}>⚡ Admin</Text></TouchableOpacity>
        )}
      </View>

      {activeTab === 'contests' && (
        <View style={styles.listSection}>
          <View style={{ flexDirection: 'row', marginBottom: 8 }}>
            {['ALL', 'Bollywood', 'Hollywood', 'Tollywood'].map(cat => (
              <TouchableOpacity key={cat} style={[styles.filterChip, selectedCategory === cat && styles.activeFilterChip]} onPress={() => setSelectedCategory(cat)}>
                <Text style={{ color: '#fff', fontSize: 11 }}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <FlatList
            data={filteredMovies}
            keyExtractor={(item, index) => index.toString()}
            ListEmptyComponent={<Text style={{ color: '#aaa', textAlign: 'center', marginTop: 40 }}>No Contests Active.</Text>}
            renderItem={({ item }) => {
              const stats = getMovieStats(item.title, item.entry_fee || 10);
              const locked = isContestLocked(item.lock_date);
              return (
                <View style={styles.card}>
                  <Image source={{ uri: item.banner || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500' }} style={styles.bannerImage} />
                  <View style={styles.cardDetails}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={styles.movieTitle}>{item.title}</Text>
                      <Text style={styles.catBadge}>{item.category || 'Bollywood'}</Text>
                    </View>
                    <Text style={{ color: '#888', fontSize: 11, marginTop: 2 }}>📅 Release: {item.release_date}</Text>

                    <View style={styles.prizeBox}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={{ color: '#aaa', fontSize: 10 }}>🔥 Live Pool (80%): (Collected: ₹{stats.totalCollected})</Text>
                        <Text style={{ color: '#00ff87', fontSize: 10 }}>👥 {stats.entriesCount} Entries Joined</Text>
                      </View>
                      <Text style={styles.prizeAmount}>₹{stats.totalPrizePool}</Text>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
                        <Text style={styles.rankText}>🥇 1st: ₹{stats.rank1Prize} {stats.isTicketUnlocked ? '+🎟️ Ticket' : ''}</Text>
                        <Text style={styles.rankText}>🥈 2nd: ₹{stats.rank2Prize}</Text>
                        <Text style={styles.rankText}>🥉 3rd: ₹{stats.rank3Prize}</Text>
                      </View>
                    </View>

                    <View style={styles.actionRow}>
                      <TouchableOpacity style={styles.viewBoardBtn} onPress={() => { setSelectedMovie(item); setBoardModal(true); }}>
                        <Text style={{ color: '#fff', fontSize: 11 }}>🏆 Leaderboard</Text>
                      </TouchableOpacity>

                      {locked ? (
                        <View style={styles.closedBtn}><Text style={{ color: '#aaa', fontSize: 11, fontWeight: 'bold' }}>🔒 Contest Closed</Text></View>
                      ) : (
                        <TouchableOpacity style={styles.predictBtn} onPress={() => { setSelectedMovie(item); setPredictModal(true); }}>
                          <Text style={styles.predictBtnText}>Predict Now (₹{item.entry_fee || 10})</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                </View>
              );
            }}
          />
        </View>
      )}

      {activeTab === 'mycontests' && (
        <View style={styles.listSection}>
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 10 }}>🎯 My Joined Contests</Text>
          <FlatList
            data={userJoinedMovies}
            keyExtractor={(item, index) => index.toString()}
            ListEmptyComponent={<Text style={{ color: '#aaa', textAlign: 'center', marginTop: 40 }}>You haven't joined any contest yet.</Text>}
            renderItem={({ item }) => {
              const myPreds = leaderboardData.filter(p => p.movie_title?.toLowerCase() === item.title?.toLowerCase() && p.user_phone?.includes(phoneNumber));
              return (
                <View style={styles.card}>
                  <View style={{ padding: 12 }}>
                    <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>🎬 {item.title}</Text>
                    <Text style={{ color: '#00ff87', fontSize: 12, marginTop: 4 }}>My Predictions:</Text>
                    {myPreds.map((p, idx) => (
                      <Text key={idx} style={{ color: '#ccc', fontSize: 12 }}>• ₹{p.predicted_amount} Crores</Text>
                    ))}
                    <TouchableOpacity style={[styles.viewBoardBtn, { marginTop: 10 }]} onPress={() => { setSelectedMovie(item); setBoardModal(true); }}>
                      <Text style={{ color: '#fff', fontSize: 11, textAlign: 'center' }}>🏆 Check Live Rankings</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            }}
          />
        </View>
      )}

      {activeTab === 'profile' && (
        <View style={styles.listSection}>
          <View style={styles.adminCard}>
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>👤 {userName}</Text>
            <Text style={{ color: '#aaa', fontSize: 12 }}>📞 +91 {phoneNumber}</Text>
            <View style={{ marginTop: 20, padding: 12, backgroundColor: '#262626', borderRadius: 8 }}>
              <Text style={{ color: '#aaa', fontSize: 11 }}>Wallet Balance:</Text>
              <Text style={{ color: '#00ff87', fontSize: 24, fontWeight: 'bold' }}>₹{walletBalance}</Text>
            </View>
          </View>
        </View>
      )}

      {activeTab === 'admin' && (
        <Admin 
          moviesList={moviesList}
          onPublish={handleAddMovieByAdmin} 
          onEditMovie={handleEditMovieByAdmin}
          onWinner={handleDeclareWinner} 
          onAddWallet={handleAddWalletAdmin} 
        />
      )}

      <Modal visible={predictModal} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>🎬 {selectedMovie?.title}</Text>
            <Text style={{ color: '#aaa', fontSize: 11, marginTop: 2 }}>Entry Fee: ₹{selectedMovie?.entry_fee || 10}</Text>

            <Text style={styles.label}>Day 1 Box Office Collection (Crores):</Text>
            <TextInput style={styles.input} keyboardType="decimal-pad" value={predictionVal} onChangeText={setPredictionVal} placeholder="e.g. 45.5" placeholderTextColor="#666" />

            <TouchableOpacity style={styles.primaryBtn} onPress={handlePredictClick}><Text style={styles.primaryBtnText}>Confirm Entry (Pay ₹{selectedMovie?.entry_fee || 10})</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => setPredictModal(false)} style={{ marginTop: 12 }}><Text style={{ color: '#aaa', textAlign: 'center' }}>Cancel</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={boardModal} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>🏆 Leaderboard ({selectedMovie?.title})</Text>
            <FlatList
              data={getMovieStats(selectedMovie?.title, selectedMovie?.entry_fee).movieEntries}
              keyExtractor={(item, index) => index.toString()}
              ListEmptyComponent={<Text style={{ color: '#aaa', textAlign: 'center', marginVertical: 20 }}>No entries yet.</Text>}
              renderItem={({ item, index }) => (
                <View style={styles.boardCard}>
                  <View style={styles.rankCircle}><Text style={{ color: '#00ff87', fontWeight: 'bold' }}>#{index + 1}</Text></View>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 12 }}>{item.user_phone}</Text>
                  </View>
                  <Text style={{ color: '#00ff87', fontWeight: 'bold', fontSize: 13 }}>₹{item.predicted_amount} Cr</Text>
                </View>
              )}
            />
            <TouchableOpacity onPress={() => setBoardModal(false)} style={{ marginTop: 12 }}><Text style={{ color: '#e50914', textAlign: 'center', fontWeight: 'bold' }}>Close</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}
