import React from "react";
import { Info } from "lucide-react";

export default function FootnoteGuide() {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
      <div className="flex items-start gap-2">
        <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
        <div className="text-sm text-blue-900">
          <h4 className="font-semibold mb-2">GFM 각주 사용법</h4>
          <div className="space-y-2">
            <div>
              <strong>1. 각주 참조 삽입:</strong>
              <ul className="list-disc list-inside ml-4 mt-1">
                <li>
                  툴바의{" "}
                  <code className="px-1 py-0.5 bg-white rounded">[^]</code> 버튼
                  클릭
                </li>
                <li>
                  또는 직접 입력:{" "}
                  <code className="px-1 py-0.5 bg-white rounded">[^1]</code>{" "}
                  또는{" "}
                  <code className="px-1 py-0.5 bg-white rounded">[^label]</code>
                </li>
              </ul>
            </div>
            <div>
              <strong>2. 각주 정의 작성:</strong>
              <ul className="list-disc list-inside ml-4 mt-1">
                <li>
                  문서 하단에 작성:{" "}
                  <code className="px-1 py-0.5 bg-white rounded">
                    [^1]: 각주 내용
                  </code>
                </li>
                <li>여러 줄 가능: 들여쓰기로 계속 작성</li>
              </ul>
            </div>
            <div className="mt-2 p-2 bg-white rounded border border-blue-200">
              <strong>예시:</strong>
              <pre className="text-xs mt-1 overflow-x-auto">
                {`이것은 본문입니다[^1].

더 많은 내용[^note2].

[^1]: 첫 번째 각주입니다.
[^note2]: 라벨을 사용한 각주입니다.`}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
