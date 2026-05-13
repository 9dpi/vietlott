
import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 border-t border-slate-700/50 mt-12">
      <div className="container mx-auto px-4 py-6 text-center text-slate-500 text-sm">
        <p><strong>Tuyên bố miễn trách nhiệm:</strong> Ứng dụng này chỉ mang tính chất giải trí và tham khảo. Các con số dự đoán được tạo bởi AI và không đảm bảo trúng giải. Hãy chơi có trách nhiệm.</p>
        <p className="mt-2">&copy; 2025 Vietlott AI Dự Đoán. Bảo lưu mọi quyền.</p>
      </div>
    </footer>
  );
};
