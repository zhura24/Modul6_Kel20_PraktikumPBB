import { ScrollView, StyleSheet, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { tokens } from "../theme/tokens.js";

const { color, space, radius, shadow } = tokens;

const members = [
  { nim: "21120124140159", name: "FRANS SUYITNO PASTIKA MANURUNG" },
  { nim: "21120124130059", name: "GHIFARIY ATHAYARAVISHA PRAMANA" },
  { nim: "21120124140131", name: "KEVIN NIBRAS KUSUMA" },
  { nim: "21120124140132", name: "MUHAMMAD FAHRI SANI" },
];

function ProfileInfo({ icon, label, value }) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}>
        <Ionicons name={icon} size={18} color={color.primary} />
      </View>
      <View style={styles.infoText}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

export function ProfileScreen() {
  return (
    <ScrollView
      style={styles.safe}
      contentContainerStyle={styles.container}
      contentInsetAdjustmentBehavior="automatic"
    >
      <View style={styles.hero}>
        <View style={styles.avatar}>
          <Ionicons name="people" size={34} color={color.onPrimary} />
        </View>
        <Text style={styles.groupName}>Kelompok 20</Text>
        <Text style={styles.course}>Praktikum PPB</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Informasi Kelompok</Text>
        <ProfileInfo
          icon="people-outline"
          label="Kelompok"
          value="Kelompok 20"
        />
        <ProfileInfo
          icon="book-outline"
          label="Mata kuliah"
          value="Praktikum PPB"
        />
        <ProfileInfo
          icon="phone-portrait-outline"
          label="Nama aplikasi"
          value="LiveTemp"
        />
      </View>

      <View style={styles.card}>
        <View style={styles.memberTitleRow}>
          <Text style={styles.sectionTitle}>Anggota Kelompok</Text>
          <View style={styles.memberCount}>
            <Text style={styles.memberCountText}>{members.length} orang</Text>
          </View>
        </View>
        {members.map((member, index) => (
          <View key={member.nim} style={styles.memberRow}>
            <View style={styles.memberNumber}>
              <Text style={styles.memberNumberText}>
                {String(index + 1).padStart(2, "0")}
              </Text>
            </View>
            <View style={styles.memberDetails}>
              <Text style={styles.memberName}>{member.name}</Text>
              <Text style={styles.memberNim}>{member.nim}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Tentang Proyek</Text>
        <Text style={styles.description}>
          LiveTemp memantau suhu dan kelembapan secara real-time, menampilkan
          riwayat pembacaan sensor, serta membantu mengatur ambang batas
          peringatan.
        </Text>
        <View style={styles.projectTag}>
          <Ionicons name="radio-outline" size={16} color={color.primary} />
          <Text style={styles.projectTagText}>Monitoring IoT</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: color.bg,
  },
  container: {
    padding: space.lg,
    paddingBottom: space.xxl,
    gap: space.lg,
  },
  hero: {
    alignItems: "center",
    paddingVertical: space.xl,
  },
  avatar: {
    width: 84,
    height: 84,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: color.primary,
    borderRadius: 42,
    marginBottom: space.md,
  },
  groupName: {
    color: color.text,
    fontSize: 24,
    fontWeight: "700",
  },
  course: {
    marginTop: 4,
    color: color.text2,
    fontSize: 15,
  },
  card: {
    gap: space.md,
    padding: space.xl,
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.border,
    borderRadius: radius.card,
    borderCurve: "continuous",
    boxShadow: shadow.card,
  },
  sectionTitle: {
    color: color.text,
    fontSize: tokens.type.section,
    fontWeight: "700",
  },
  memberTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: space.sm,
  },
  memberCount: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    backgroundColor: color.surface2,
    borderRadius: radius.pill,
  },
  memberCountText: {
    color: color.text2,
    fontSize: 12,
    fontWeight: "600",
  },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
    paddingTop: space.md,
    borderTopWidth: 1,
    borderTopColor: color.border,
  },
  memberNumber: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: color.surface2,
    borderRadius: 18,
  },
  memberNumberText: {
    color: color.primary,
    fontSize: 12,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  memberDetails: {
    flex: 1,
    gap: 4,
  },
  memberName: {
    color: color.text,
    fontSize: 13,
    fontWeight: "600",
  },
  memberNim: {
    color: color.text3,
    fontSize: 12,
    fontVariant: ["tabular-nums"],
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
  },
  infoIcon: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: color.surface2,
    borderRadius: radius.input,
  },
  infoText: {
    flex: 1,
    gap: 2,
  },
  infoLabel: {
    color: color.text3,
    fontSize: 12,
  },
  infoValue: {
    color: color.text,
    fontSize: 15,
    fontWeight: "600",
  },
  description: {
    color: color.text2,
    fontSize: 14,
    lineHeight: 21,
  },
  projectTag: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: space.sm,
    paddingVertical: 8,
    paddingHorizontal: space.md,
    backgroundColor: color.surface2,
    borderRadius: radius.pill,
  },
  projectTagText: {
    color: color.primary,
    fontSize: 13,
    fontWeight: "600",
  },
});
