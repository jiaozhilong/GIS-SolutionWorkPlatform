package com.gis.platform.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.gis.platform.dto.request.ImaConfigReq;
import com.gis.platform.dto.request.ImaSearchReq;
import com.gis.platform.dto.response.ImaConfigVO;
import com.gis.platform.dto.response.ImaSearchItem;
import com.gis.platform.dto.response.ImaSearchResult;
import com.gis.platform.entity.ImaConfig;
import com.gis.platform.mapper.ImaConfigMapper;
import com.gis.platform.service.ImaService;
import com.gis.platform.util.AesUtil;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ImaServiceImpl implements ImaService {

    private final ImaConfigMapper imaConfigMapper;

    public ImaServiceImpl(ImaConfigMapper imaConfigMapper) {
        this.imaConfigMapper = imaConfigMapper;
    }

    @Override
    public ImaConfigVO createConfig(ImaConfigReq req) {
        if (req.getApiKey() == null || req.getApiKey().trim().isEmpty()) {
            throw new IllegalArgumentException("新增 IMA 配置时 API Key 不能为空");
        }
        ImaConfig config = new ImaConfig();
        applyReq(config, req, true);
        config.setCreatedAt(LocalDateTime.now());
        config.setUpdatedAt(LocalDateTime.now());
        imaConfigMapper.insert(config);
        return ImaConfigVO.from(config);
    }

    @Override
    public ImaConfigVO updateConfig(String id, ImaConfigReq req) {
        ImaConfig config = requireConfig(id);
        applyReq(config, req, false);
        config.setUpdatedAt(LocalDateTime.now());
        imaConfigMapper.updateById(config);
        return ImaConfigVO.from(config);
    }

    @Override
    public List<ImaConfigVO> listConfigs() {
        return imaConfigMapper.selectList(new LambdaQueryWrapper<ImaConfig>().orderByDesc(ImaConfig::getCreatedAt))
                .stream()
                .map(ImaConfigVO::from)
                .collect(Collectors.toList());
    }

    @Override
    public void deleteConfig(String id) {
        requireConfig(id);
        imaConfigMapper.deleteById(id);
    }

    @Override
    public boolean testConnection(String id) {
        ImaConfig config = requireConfig(id);
        AesUtil.decrypt(config.getApiKeyEnc());
        // TODO: 接入真实 IMA SDK 后在这里执行知识库连接测试。
        return true;
    }

    @Override
    public ImaSearchResult search(ImaSearchReq req) {
        String kbId = req.getKbIds() == null || req.getKbIds().isEmpty() ? "kb-mock" : req.getKbIds().get(0);
        // TODO: 接入真实 IMA SDK 后替换为真实知识库检索。
        List<ImaSearchItem> items = Arrays.asList(
                new ImaSearchItem("doc-001", "智慧城市时空大数据平台建设方案.pdf", "PDF", 0.95, kbId, "GIS 方案知识库"),
                new ImaSearchItem("doc-002", "城市运行一网统管 GIS 能力清单.doc", "DOC", 0.91, kbId, "GIS 方案知识库"),
                new ImaSearchItem("doc-003", "自然资源一张图数据治理实践.pdf", "PDF", 0.88, kbId, "GIS 方案知识库")
        );
        ImaSearchResult result = new ImaSearchResult();
        result.setQuery(req.getQuery());
        result.setTotalFound(items.size());
        result.setItems(items);
        return result;
    }

    private ImaConfig requireConfig(String id) {
        ImaConfig config = imaConfigMapper.selectById(id);
        if (config == null) {
            throw new IllegalArgumentException("IMA 配置不存在: " + id);
        }
        return config;
    }

    private void applyReq(ImaConfig config, ImaConfigReq req, boolean creating) {
        config.setName(req.getName());
        if (req.getApiKey() != null && !req.getApiKey().trim().isEmpty()) {
            config.setApiKeyEnc(AesUtil.encrypt(req.getApiKey()));
        } else if (creating) {
            throw new IllegalArgumentException("API Key 不能为空");
        }
        config.setKbId(req.getKbId());
        config.setKbName(req.getKbName());
        config.setKbType(defaultValue(req.getKbType(), "mine"));
        config.setIndustryTag(req.getIndustryTag());
        config.setIsDefault(defaultInt(req.getIsDefault(), 0));
        config.setIsActive(defaultInt(req.getIsActive(), 1));
    }

    private String defaultValue(String value, String fallback) {
        return value == null || value.trim().isEmpty() ? fallback : value;
    }

    private Integer defaultInt(Integer value, Integer fallback) {
        return value == null ? fallback : value;
    }
}

