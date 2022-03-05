module.exports = function override(config, env) {

    config.output = {
        ...config.output, // copy all settings
        filename: "[name].js",
        chunkFilename: "[name].chunk.js",
        assetModuleFilename: '[hash][ext]',
        publicPath: '',
    };
    return config;
};