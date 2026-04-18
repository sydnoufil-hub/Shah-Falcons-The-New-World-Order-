// Use hardcoded values to avoid undefined import at module load time
const PRIMARY_COLOR = '#1E3A5F';

export const Theme = {
  shadow: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 15,
  },
  typography: {
    header: { fontSize: 22, fontWeight: 'bold', color: PRIMARY_COLOR },
    subHeader: { fontSize: 14, color: '#7F8C8D' },
    amount: { fontSize: 18, fontWeight: '600' }
  }
};  