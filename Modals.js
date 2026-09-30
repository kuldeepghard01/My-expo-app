import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, TextInput, FlatList } from 'react-native';
import { styles } from './styles';

export function DisclaimerModal({ visible, onAgree }) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.topOverlayBg}>
        <View style={[styles.modalCard, { borderColor: '#e50914', borderWidth: 1.5 }]}>
          <Text style={[styles.modalTitle, { color: '#e50914', textAlign: 'center' }]}>⚠️ RESPONSIBLE GAMING & 18+ NOTICE</Text>
          <ScrollView style={{ maxHeight: 200, marginVertical: 10 }}>
            <Text style={{ color: '#fff', fontSize: 11 }}>
              • You must be at least 18 years of age to participate in MCP Fantasy contests.{'\n'}
              • Fantasy sports and prediction involve financial risk and may be addictive. Please play responsibly and at your own risk.{'\n'}
              • Users from restricted states where paid fantasy contests are prohibited by law are not allowed to join paid contests.
            </Text>
          </ScrollView>
          <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: '#00ff87' }]} onPress={onAgree}>
            <Text style={{ color: '#000', fontWeight: 'bold' }}>I Agree & Continue (18+)</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

export function MovieDetailModal({ visible, onClose, selectedMovie, isContestLocked, getContestStats, winnersList, onOpenLeaderboard, onOpenPredict, onOpenPrivateRoom }) {
  const [showWinningsFee, setShowWinningsFee] = useState(null);

  if (!selectedMovie) return null;
  
  const locked = isContestLocked(selectedMovie.release_date);
  const isWinnerDeclaredAny = Object.keys(winnersList).some(k => k.startsWith(selectedMovie.title?.toLowerCase()));
  const isContestClosedFully = locked || isWinnerDeclaredAny;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalBg}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>🎬 {selectedMovie.title}</Text>
          <Text style={{ color: '#aaa', fontSize: 11, marginBottom: 10 }}>📅 Release Date: {selectedMovie.release_date}</Text>

          {isContestClosedFully && (
            <View style={{ backgroundColor: '#2a1212', padding: 8, borderRadius: 6, marginBottom: 10, borderWidth: 1, borderColor: '#e50914' }}>
              <Text style={{ color: '#e50914', fontWeight: 'bold', fontSize: 11, textAlign: 'center' }}>🔒 Contests Closed & Winner Declared for this Movie</Text>
            </View>
          )}

          <ScrollView style={{ maxHeight: 360 }}>
            {[9, 49, 99].map(fee => {
              const stats = getContestStats(selectedMovie.title, fee);
              const winner = winnersList[`${selectedMovie.title?.toLowerCase()}_${fee}`];

              const rank1 = Math.round(stats.totalPrizePool * 0.50);
              const rank2_8_each = Math.round((stats.totalPrizePool * 0.30) / 7);
              const rank9_25_each = Math.round((stats.totalPrizePool * 0.20) / 17);

              return (
                <View key={fee} style={{ backgroundColor: '#222', padding: 10, borderRadius: 8, marginBottom: 10, borderWidth: 1, borderColor: '#333' }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 14 }}>₹{fee} Contest Pool</Text>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <TouchableOpacity onPress={() => setShowWinningsFee(showWinningsFee === fee ? null : fee)}>
                        <Text style={{ color: '#FFD700', fontSize: 11, textDecorationLine: 'underline' }}>🎁 Winnings</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => onOpenLeaderboard(fee)}>
                        <Text style={{ color: '#00ff87', fontSize: 11, textDecorationLine: 'underline' }}>Leaderboard ({stats.entriesCount})</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {showWinningsFee === fee && (
                    <View style={{ backgroundColor: '#151515', padding: 8, borderRadius: 6, marginVertical: 6, borderWidth: 1, borderColor: '#FFD700' }}>
                      <Text style={{ color: '#FFD700', fontSize: 11, fontWeight: 'bold' }}>🏆 Prize Pool Split (₹{stats.totalPrizePool})</Text>
                      <Text style={{ color: '#fff', fontSize: 10 }}>🥇 1st Rank: ₹{rank1} (50%)</Text>
                      <Text style={{ color: '#fff', fontSize: 10 }}>🥈 Ranks 2-8: ₹{rank2_8_each} / each (30%)</Text>
                      <Text style={{ color: '#fff', fontSize: 10 }}>🥉 Ranks 9-25: ₹{rank9_25_each} / each (20%)</Text>
                    </View>
                  )}

                  {winner ? (
                    <View style={{ marginTop: 6, backgroundColor: '#2b2b10', padding: 6, borderRadius: 4 }}>
                      <Text style={{ color: '#FFD700', fontWeight: 'bold', fontSize: 11 }}>👑 Winner: {winner.userName}</Text>
                      <Text style={{ color: '#00ff87', fontWeight: 'bold', fontSize: 11 }}>💰 Prize Paid: ₹{winner.prize}</Text>
                    </View>
                  ) : (
                    <View style={{ marginTop: 6, flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ color: '#aaa', fontSize: 11 }}>Prize Pool: <Text style={{ color: '#00ff87', fontWeight: 'bold' }}>₹{stats.totalPrizePool}</Text></Text>
                      <Text style={{ color: '#aaa', fontSize: 11 }}>1st Rank: <Text style={{ color: '#FFD700', fontWeight: 'bold' }}>₹{stats.rank1Prize}</Text></Text>
                    </View>
                  )}

                  {!winner && (
                    <View style={{ marginTop: 8 }}>
                      {isContestClosedFully ? (
                        <View style={styles.closedBtn}><Text style={{ color: '#aaa', textAlign: 'center', fontSize: 11 }}>🔒 Entry Closed</Text></View>
                      ) : (
                        <TouchableOpacity style={styles.primaryBtn} onPress={() => onOpenPredict(fee)}>
                          <Text style={{ color: '#fff', fontWeight: 'bold', textAlign: 'center', fontSize: 11 }}>Predict Now (₹{fee})</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                </View>
              );
            })}

            {!isContestClosedFully && (
              <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: '#8a2be2', marginTop: 5 }]} onPress={onOpenPrivateRoom}>
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 12 }}>🔒 Private Contest Room (Create / Join)</Text>
              </TouchableOpacity>
            )}
          </ScrollView>

          <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: '#333', marginTop: 10 }]} onPress={onClose}>
            <Text style={{ color: '#fff', textAlign: 'center' }}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

export function PredictModal({ visible, onClose, selectedMovie, selectedFee, predictionVal, setPredictionVal, onSubmit, isEditing }) {
  if (!selectedMovie) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.topOverlayBg}>
        <View style={[styles.modalCard, { borderColor: '#00ff87', borderWidth: 1.5 }]}>
          <Text style={styles.modalTitle}>{isEditing ? '✏️ Edit Prediction' : '🎯 Prediction for ₹' + selectedFee + ' Contest'}</Text>
          <Text style={{ color: '#00ff87', fontWeight: 'bold', fontSize: 13, marginTop: 4 }}>🎬 {selectedMovie.title}</Text>

          <View style={{ backgroundColor: '#282512', padding: 8, borderRadius: 6, marginVertical: 8, borderWidth: 1, borderColor: '#FFD700' }}>
            <Text style={{ color: '#FFD700', fontWeight: 'bold', fontSize: 11 }}>💡 Smart Prediction Hint & Industry Buzz:</Text>
            <Text style={{ color: '#fff', fontSize: 10, marginTop: 2 }}>
              • Estimated Day 1 Opening Range: ₹25.00 Cr - ₹65.00 Cr{'\n'}
              • Tip: Enter precise decimal values (e.g., 42.80) to maximize win margin.
            </Text>
          </View>

          <TextInput
            style={styles.input}
            keyboardType="decimal-pad"
            placeholder="Enter day one Box Office in Cr (e.g. 42.80)"
            placeholderTextColor="#666"
            value={predictionVal}
            onChangeText={setPredictionVal}
          />

          <View style={{ flexDirection: 'row', gap: 10, marginTop: 6 }}>
            <TouchableOpacity style={[styles.primaryBtn, { flex: 1, backgroundColor: '#333' }]} onPress={onClose}>
              <Text style={{ color: '#fff' }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.primaryBtn, { flex: 1, backgroundColor: '#00ff87' }]} onPress={onSubmit}>
              <Text style={{ color: '#000', fontWeight: 'bold' }}>{isEditing ? 'Update Entry' : 'Submit Entry'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
export function PrivateRoomModal({ visible, onClose, selectedMovie, onCreateRoom, onJoinRoom, privateRooms, leaderboardData, currentUserName }) {
  const [tab, setTab] = useState('menu');
  const [selectedFee, setSelectedFee] = useState(9);
  const [customFee, setCustomFee] = useState('');
  const [selectedSpots, setSelectedSpots] = useState(4);
  const [customSpots, setCustomSpots] = useState('');

  const [searchCode, setSearchCode] = useState('');
  const [joinedRoomDetails, setJoinedRoomDetails] = useState(null);

  if (!selectedMovie) return null;

  const myCreatedRooms = privateRooms.filter(r => r.movie_title === selectedMovie.title && r.created_by === currentUserName);

  const handleCreate = () => {
    const fee = customFee ? parseFloat(customFee) : selectedFee;
    const spots = customSpots ? parseInt(customSpots) : selectedSpots;
    if (!fee || fee <= 0) return alert('Enter valid Entry Fee.');
    if (!spots || spots < 2) return alert('Spots must be at least 2.');

    onCreateRoom(selectedMovie.title, fee, spots);
    setTab('menu');
  };

  const handleSearchRoom = () => {
    if (!searchCode.trim()) return alert('Enter Room Code.');
    const code = searchCode.trim().toUpperCase();
    const found = privateRooms.find(r => r.code === code);
    if (!found) return alert('Invalid Room Code!');

    const joinedCount = leaderboardData.filter(p => p.private_code === code).length;
    setJoinedRoomDetails({ ...found, joinedCount });
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalBg}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>🔒 Private Contest ({selectedMovie.title})</Text>

          {tab === 'menu' && (
            <View style={{ marginTop: 15 }}>
              <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: '#e50914', marginBottom: 10 }]} onPress={() => setTab('create')}>
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>➕ Create Private Room</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: '#2196F3', marginBottom: 10 }]} onPress={() => setTab('join')}>
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>🔑 Join Private Room</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: '#8a2be2' }]} onPress={() => setTab('myrooms')}>
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>🏆 Created Rooms ({myCreatedRooms.length})</Text>
              </TouchableOpacity>
            </View>
          )}

          {tab === 'myrooms' && (
            <View style={{ marginTop: 10 }}>
              <Text style={{ color: '#00ff87', fontWeight: 'bold', marginBottom: 8 }}>My Created Rooms:</Text>
              <ScrollView style={{ maxHeight: 200 }}>
                {myCreatedRooms.length === 0 ? (
                  <Text style={{ color: '#666', textAlign: 'center', marginVertical: 15 }}>No rooms created by you yet.</Text>
                ) : (
                  myCreatedRooms.map((r, idx) => {
                    const joined = leaderboardData.filter(p => p.private_code === r.code).length;
                    return (
                      <View key={idx} style={{ backgroundColor: '#222', padding: 8, borderRadius: 6, marginBottom: 6 }}>
                        <Text style={{ color: '#FFD700', fontWeight: 'bold' }}>Code: {r.code}</Text>
                        <Text style={{ color: '#ccc', fontSize: 11 }}>Fee: ₹{r.entry_fee} | Spots: {joined} / {r.spots}</Text>
                      </View>
                    );
                  })
                )}
              </ScrollView>
              <TouchableOpacity onPress={() => setTab('menu')} style={{ marginTop: 10 }}><Text style={{ color: '#aaa', textAlign: 'center' }}>⬅ Back</Text></TouchableOpacity>
            </View>
          )}

          {tab === 'create' && (
            <ScrollView style={{ marginTop: 10 }}>
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 12, marginBottom: 4 }}>Select Entry Fee (₹):</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 }}>
                {[9, 49, 99].map(f => (
                  <TouchableOpacity key={f} style={[styles.filterChip, selectedFee === f && !customFee && styles.activeFilterChip]} onPress={() => { setSelectedFee(f); setCustomFee(''); }}>
                    <Text style={{ color: '#fff', fontSize: 11 }}>₹{f}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput style={styles.input} placeholder="Custom Entry Fee (₹)" placeholderTextColor="#666" keyboardType="numeric" value={customFee} onChangeText={setCustomFee} />

              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 12, marginTop: 6, marginBottom: 4 }}>Select Spots:</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 }}>
                {[4, 6, 30].map(s => (
                  <TouchableOpacity key={s} style={[styles.filterChip, selectedSpots === s && !customSpots && styles.activeFilterChip]} onPress={() => { setSelectedSpots(s); setCustomSpots(''); }}>
                    <Text style={{ color: '#fff', fontSize: 11 }}>{s} Spots</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput style={styles.input} placeholder="Custom Spots (e.g. 10)" placeholderTextColor="#666" keyboardType="numeric" value={customSpots} onChangeText={setCustomSpots} />

              <TouchableOpacity style={[styles.primaryBtn, { marginTop: 10 }]} onPress={handleCreate}>
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>Generate Room Code & Create</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setTab('menu')} style={{ marginTop: 10 }}><Text style={{ color: '#aaa', textAlign: 'center' }}>⬅ Back</Text></TouchableOpacity>
            </ScrollView>
          )}

          {tab === 'join' && (
            <View style={{ marginTop: 10 }}>
              <TextInput style={styles.input} placeholder="Enter 6-Digit Room Code" placeholderTextColor="#666" value={searchCode} onChangeText={setSearchCode} autoCapitalize="characters" />
              <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: '#2196F3' }]} onPress={handleSearchRoom}>
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>Search Room</Text>
              </TouchableOpacity>

              {joinedRoomDetails && (
                <View style={{ backgroundColor: '#222', padding: 10, borderRadius: 8, marginTop: 12 }}>
                  <Text style={{ color: '#00ff87', fontWeight: 'bold' }}>Room: {joinedRoomDetails.code}</Text>
                  <Text style={{ color: '#fff', fontSize: 11, marginTop: 2 }}>💰 Entry Fee: ₹{joinedRoomDetails.entry_fee}</Text>
                  <Text style={{ color: '#ccc', fontSize: 11, marginTop: 2 }}>👥 Spots: {joinedRoomDetails.joinedCount} / {joinedRoomDetails.spots}</Text>

                  {joinedRoomDetails.joinedCount >= joinedRoomDetails.spots ? (
                    <Text style={{ color: '#e50914', fontWeight: 'bold', marginTop: 6 }}>🔒 Room Full!</Text>
                  ) : (
                    <TouchableOpacity style={[styles.primaryBtn, { marginTop: 8 }]} onPress={() => { onJoinRoom(joinedRoomDetails); setTab('menu'); setJoinedRoomDetails(null); onClose(); }}>
                      <Text style={{ color: '#fff', fontWeight: 'bold' }}>Join & Predict Now</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
              <TouchableOpacity onPress={() => setTab('menu')} style={{ marginTop: 12 }}><Text style={{ color: '#aaa', textAlign: 'center' }}>⬅ Back</Text></TouchableOpacity>
            </View>
          )}

          <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: '#333', marginTop: 12 }]} onPress={onClose}>
            <Text style={{ color: '#fff', textAlign: 'center' }}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

export function LeaderboardModal({ visible, onClose, selectedMovie, boardFee, getContestStats, winnersList }) {
  if (!selectedMovie) return null;
  const stats = getContestStats(selectedMovie.title, boardFee);
  const winnerInfo = winnersList[`${selectedMovie.title?.toLowerCase()}_${boardFee}`];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalBg}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>📊 Leaderboard (₹{boardFee} Pool)</Text>
          <Text style={{ color: '#aaa', fontSize: 11, marginBottom: 10 }}>{selectedMovie.title}</Text>

          <ScrollView style={{ maxHeight: 280 }}>
            {stats.movieEntries.length === 0 ? (
              <Text style={{ color: '#666', textAlign: 'center', marginVertical: 20 }}>No predictions in this pool yet.</Text>
            ) : (
              stats.movieEntries.map((p, idx) => {
                const isWinner = winnerInfo && winnerInfo.userName === p.user_phone;
                return (
                  <View key={idx} style={{ backgroundColor: isWinner ? '#1b2d1f' : '#222', borderColor: isWinner ? '#00ff87' : '#333', borderWidth: 1, padding: 8, borderRadius: 6, marginBottom: 6, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View>
                      <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>#{idx + 1} {p.user_phone}</Text>
                      <Text style={{ color: '#aaa', fontSize: 10 }}>Predicted: ₹{p.predicted_amount} Cr</Text>
                    </View>
                    {isWinner ? (
                      <View style={{ backgroundColor: '#00ff87', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 }}>
                        <Text style={{ color: '#000', fontWeight: 'bold', fontSize: 11 }}>🏆 Won ₹{winnerInfo.prize}</Text>
                      </View>
                    ) : (
                      <Text style={{ color: '#00ff87', fontWeight: 'bold', fontSize: 12 }}>₹{p.predicted_amount} Cr</Text>
                    )}
                  </View>
                );
              })
            )}
          </ScrollView>

          <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: '#333', marginTop: 10 }]} onPress={onClose}>
            <Text style={{ color: '#fff', textAlign: 'center' }}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

export function NotificationsModal({ visible, onClose, notifications, onMarkSeen }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalBg}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>🔔 Notifications</Text>
          <FlatList
            data={notifications}
            keyExtractor={(item, index) => index.toString()}
            ListEmptyComponent={<Text style={{ color: '#888', textAlign: 'center', marginVertical: 20 }}>No Notifications.</Text>}
            renderItem={({ item }) => (
              <View style={{ backgroundColor: '#222', padding: 10, borderRadius: 6, marginBottom: 8 }}>
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 13 }}>{item.title}</Text>
                <Text style={{ color: '#ccc', fontSize: 11, marginTop: 2 }}>{item.message}</Text>
                <Text style={{ color: '#666', fontSize: 9, marginTop: 4 }}>{item.date}</Text>
              </View>
            )}
          />
          <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: '#333', marginTop: 10 }]} onPress={() => { onMarkSeen(); onClose(); }}>
            <Text style={{ color: '#fff', textAlign: 'center' }}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

export function SettingsModal({ visible, onClose }) {
  const [tab, setTab] = useState('menu');

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalBg}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>⚙️ Settings & Support</Text>

          {tab === 'menu' && (
            <View style={{ marginTop: 10 }}>
              <View style={{ backgroundColor: '#222', padding: 10, borderRadius: 8, marginBottom: 8 }}>
                <Text style={{ color: '#00ff87', fontWeight: 'bold' }}>🎧 Help Center & Support</Text>
                <Text style={{ color: '#fff', fontSize: 12, marginTop: 2 }}>Email Us: mcp85169@gmail.com</Text>
              </View>

              <TouchableOpacity style={{ backgroundColor: '#2a2a2a', padding: 10, borderRadius: 8, marginBottom: 6 }} onPress={() => setTab('terms')}>
                <Text style={{ color: '#fff', fontSize: 12 }}>📜 Terms and Conditions</Text>
              </TouchableOpacity>

              <TouchableOpacity style={{ backgroundColor: '#2a2a2a', padding: 10, borderRadius: 8, marginBottom: 6 }} onPress={() => setTab('privacy')}>
                <Text style={{ color: '#fff', fontSize: 12 }}>🔒 Privacy Policy</Text>
              </TouchableOpacity>

              <View style={{ backgroundColor: '#181818', padding: 8, borderRadius: 6, marginTop: 8 }}>
                <Text style={{ color: '#666', fontSize: 10 }}>MCP Fantasy Pro v1.0.6</Text>
              </View>
            </View>
          )}

          {tab === 'terms' && (
            <ScrollView style={{ marginTop: 10, maxHeight: 200 }}>
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 13 }}>Terms & Conditions</Text>
              <Text style={{ color: '#ccc', fontSize: 11, marginTop: 4 }}>
                1. Submit predictions before release date lock.{'\n'}
                2. Entry fees deducted from wallet balance.{'\n'}
                3. Winners calculated automatically using lowest difference.
              </Text>
              <TouchableOpacity onPress={() => setTab('menu')} style={{ marginTop: 10 }}><Text style={{ color: '#e50914', fontWeight: 'bold' }}>⬅ Back</Text></TouchableOpacity>
            </ScrollView>
          )}

          {tab === 'privacy' && (
            <ScrollView style={{ marginTop: 10, maxHeight: 200 }}>
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 13 }}>Privacy Policy</Text>
              <Text style={{ color: '#ccc', fontSize: 11, marginTop: 4 }}>
                User phone and name are kept strictly encrypted for authentic competition scoring.
              </Text>
              <TouchableOpacity onPress={() => setTab('menu')} style={{ marginTop: 10 }}><Text style={{ color: '#e50914', fontWeight: 'bold' }}>⬅ Back</Text></TouchableOpacity>
            </ScrollView>
          )}

          <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: '#333', marginTop: 10 }]} onPress={onClose}>
            <Text style={{ color: '#fff', textAlign: 'center' }}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
