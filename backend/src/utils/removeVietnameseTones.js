export default function removeVietnameseTones(str) {
    if (!str) return "";
    return str
        .normalize("NFD")                // Tách dấu
        .replace(/[\u0300-\u036f]/g, "")   // Xóa dấu
        .replace(/đ/g, "d")
        .replace(/Đ/g, "d")               // Đổi Đ hoa thành d thường luôn
        .toLowerCase()                    // QUAN TRỌNG: Đưa về chữ thường
        .replace(/\s+/g, " ")             // Gom nhiều khoảng trắng thành 1
        .trim();                          // Cắt khoảng trắng 2 đầu
}
// nếu mục đích seach thì k nên dùng slugify vì  khoảng cách nó chuyển thành -