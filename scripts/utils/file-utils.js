/**
 * 파일 조작 유틸리티
 * JSON 파일 읽기/쓰기, 디렉토리 관리 등을 담당합니다.
 */

const fs = require('fs').promises;
const path = require('path');

class FileUtils {
  /**
   * JSON 파일 읽기
   */
  static async readJson(filePath) {
    try {
      const data = await fs.readFile(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      if (error.code === 'ENOENT') {
        return null; // 파일이 없으면 null 반환
      }
      throw error;
    }
  }

  /**
   * JSON 파일 쓰기
   */
  static async writeJson(filePath, data) {
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
  }

  /**
   * 텍스트 파일 읽기
   */
  static async readText(filePath) {
    try {
      return await fs.readFile(filePath, 'utf8');
    } catch (error) {
      if (error.code === 'ENOENT') {
        return null;
      }
      throw error;
    }
  }

  /**
   * 텍스트 파일 쓰기
   */
  static async writeText(filePath, content) {
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(filePath, content, 'utf8');
  }

  /**
   * 디렉토리 존재 확인 및 생성
   */
  static async ensureDir(dirPath) {
    try {
      await fs.mkdir(dirPath, { recursive: true });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * 파일 존재 확인
   */
  static async exists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 디렉토리 내 파일 목록 조회
   */
  static async listFiles(dirPath, extension = null) {
    try {
      const files = await fs.readdir(dirPath);
      if (extension) {
        return files.filter(file => file.endsWith(extension));
      }
      return files;
    } catch (error) {
      if (error.code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }

  /**
   * 파일 삭제
   */
  static async deleteFile(filePath) {
    try {
      await fs.unlink(filePath);
      return true;
    } catch (error) {
      if (error.code === 'ENOENT') {
        return true; // 이미 없으면 성공으로 간주
      }
      throw error;
    }
  }

  /**
   * 백업 파일 생성
   */
  static async backup(filePath) {
    const backupPath = `${filePath}.backup.${Date.now()}`;
    try {
      await fs.copyFile(filePath, backupPath);
      return backupPath;
    } catch (error) {
      if (error.code === 'ENOENT') {
        return null; // 원본 파일이 없으면 백업 불필요
      }
      throw error;
    }
  }
}

module.exports = FileUtils;